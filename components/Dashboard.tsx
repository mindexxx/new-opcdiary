
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, Language, Project, DiaryEntry, Comment, Group, ProjectStats } from '../types';
import { TRANSLATIONS } from '../translations';
import { MOCK_GROUPS } from '../constants';
import { Plus, Image as ImageIcon, Send, Trash2, Edit2, Layout, ArrowLeft, ArrowRight, ExternalLink, Globe, Clock, DollarSign, TrendingUp, Save, X, Camera, Link as LinkIcon, Upload, Users, Search, Check, UserPlus, Info, Maximize2, MessageCircle, ChevronDown, ChevronUp, LogOut, MessageSquare, Target, Hourglass, Coins, Wallet, Crown, Eye, MessageCircleWarning, Database, Zap, Mail, Scroll } from 'lucide-react';
import { Roadmap } from './Roadmap';
import { Forum } from './Forum';

interface DashboardProps {
  profile: UserProfile;
  lang: Language;
  role: 'owner' | 'friend' | 'guest';
  onReset: () => void;
  isSupervisor?: boolean;
  allUsers?: UserProfile[]; // passed from App
  onUpdateProfile?: (p: UserProfile) => void; // passed from App
  onDeleteUser?: (username: string) => void; // passed from App for Supervisor
}

interface MessageItem {
  id: string;
  sender: string; // 'supervisor' | 'user' | specific user name
  content: string;
  timestamp: number;
  read?: boolean; // Track if message is read
}

// Fixed: Moved outside component to prevent re-render focus loss
const StatItem = ({ icon: Icon, label, value, field, color, isEditingProfile, editForm, setEditForm, setInfoPopup }: any) => {
  const displayValue = isEditingProfile ? editForm[field] : value;
  
  return (
      <div 
        className="relative group min-w-0 flex-1 bg-stone-50 border border-stone-100 rounded-xl px-3 py-2 flex items-center gap-2 cursor-pointer hover:border-stone-300 transition-colors"
        onClick={() => !isEditingProfile && setInfoPopup({ label, value: displayValue })}
      >
          <Icon size={14} className={`shrink-0 ${color}`} />
          <div className="min-w-0 flex-1">
              <p className="text-[9px] font-black text-stone-400 uppercase tracking-wider">{label}</p>
              {isEditingProfile ? (
                   <input 
                      value={displayValue}
                      onChange={(e) => setEditForm({...editForm, [field]: e.target.value})}
                      className="w-full bg-white text-xs font-bold px-1 rounded border border-stone-200 outline-none"
                   />
              ) : (
                  <p className="text-xs font-bold text-stone-800 truncate">{displayValue}</p>
              )}
          </div>
          {!isEditingProfile && <Info size={10} className="text-stone-300 opacity-0 group-hover:opacity-100 absolute right-2 top-2" />}
      </div>
  );
};

// Helper to parse financials from text
const analyzeEntryFinancials = (text: string) => {
    let cost = 0;
    let profit = 0;

    const costRegex = /(?:cost|spend|spent|expense|paid)[\s\w:=-]*?\$?\s*(\d+(?:,\d{3})*(?:\.\d+)?)/gi;
    const profitRegex = /(?:profit|earn|earned|revenue|income|made)[\s\w:=-]*?\$?\s*(\d+(?:,\d{3})*(?:\.\d+)?)/gi;

    let match;
    while ((match = costRegex.exec(text)) !== null) {
        const val = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(val)) cost += val;
    }
    
    while ((match = profitRegex.exec(text)) !== null) {
        const val = parseFloat(match[1].replace(/,/g, ''));
        if (!isNaN(val)) profit += val;
    }

    return { cost, profit };
};

const parseCurrency = (val: string) => {
    return parseFloat(val.replace(/[^0-9.-]+/g,"")) || 0;
}

const formatCurrency = (val: number) => {
    return `$${val.toLocaleString()}`;
}

const calculateTimeSpent = (entries: DiaryEntry[]) => {
  if (!entries || entries.length === 0) return '0d';
  const start = Math.min(...entries.map(e => e.timestamp));
  const now = Date.now();
  const diffTime = Math.max(0, now - start);
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24)); 
  
  if (diffDays > 365) {
     const years = Math.floor(diffDays / 365);
     const days = diffDays % 365;
     return `${years}y ${days}d`;
  }
  return `${diffDays}d`;
};

export const Dashboard: React.FC<DashboardProps> = ({ profile: initialProfile, lang, role, onReset, isSupervisor = false, allUsers = [], onUpdateProfile, onDeleteUser }) => {
  const t = TRANSLATIONS[lang];
  const isOwner = role === 'owner' && !isSupervisor;
  
  // State for current view mode
  const [viewMode, setViewMode] = useState<'home' | 'forum' | 'guest' | 'supervisor-hub'>(isSupervisor ? 'supervisor-hub' : 'home');
  const [guestProfile, setGuestProfile] = useState<UserProfile | null>(null);

  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Diary State
  const [diaryInput, setDiaryInput] = useState('');
  const [diaryImage, setDiaryImage] = useState<string | null>(null);
  const diaryFileRef = useRef<HTMLInputElement>(null);
  const [isDiaryExpanded, setIsDiaryExpanded] = useState(false);
  const [commentInputs, setCommentInputs] = useState<{[key: string]: string}>({});
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});

  // Diary Editing State
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');

  // UI States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState<UserProfile>(initialProfile);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState({ name: '', description: '' });
  
  // Social State
  const [searchQuery, setSearchQuery] = useState('');
  const [showNetworkModal, setShowNetworkModal] = useState(false);

  // Supervisor State
  const [showSupervisorSearch, setShowSupervisorSearch] = useState(false);
  const [supervisorQuery, setSupervisorQuery] = useState('');
  
  // OPC LETTER SYSTEM STATE
  const [showLetterModal, setShowLetterModal] = useState(false);
  const [letterView, setLetterView] = useState<'inbox' | 'chat'>('inbox');
  const [activeChatPartner, setActiveChatPartner] = useState<{name: string, isSupervisor: boolean} | null>(null);
  const [letterMessages, setLetterMessages] = useState<MessageItem[]>([]);
  const [letterInput, setLetterInput] = useState('');
  const [letterSearchQuery, setLetterSearchQuery] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);
  
  // ALERT POLLING STATE
  const [hasUnreadSupervisorMsg, setHasUnreadSupervisorMsg] = useState(false);
  const [unreadPartners, setUnreadPartners] = useState<Set<string>>(new Set());
  const [userUnreadMap, setUserUnreadMap] = useState<Record<string, boolean>>({});
  const [friendRequestsCount, setFriendRequestsCount] = useState(0);

  // Feedback State
  const [toast, setToast] = useState<{msg: string, type: 'success' | 'error'} | null>(null);

  // Persistence for Social Actions (Using a map for graph relations)
  // Schema: { "UserA": ["UserB", "UserC"], "UserB": ["UserA"] }
  const [connections, setConnections] = useState<Record<string, string[]>>(() => {
    try { return JSON.parse(localStorage.getItem('opc_connections') || '{}'); } catch { return {}; }
  });
  
  // Supervisor Persistence
  const [followedUsers, setFollowedUsers] = useState<string[]>(() => {
      try { return JSON.parse(localStorage.getItem('opc_supervisor_following') || '[]'); } catch { return []; }
  });

  // Popups
  const [infoPopup, setInfoPopup] = useState<{label: string, value: string} | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Computed display profile (User's or Guest's)
  const displayProfile = (viewMode === 'guest' || viewMode === 'supervisor-hub') && guestProfile ? guestProfile : profile;
  // Determine who is the "target" user for data loading (Projects)
  const targetUser = (viewMode === 'guest' && guestProfile) ? guestProfile : profile;
  
  const canEdit = viewMode === 'home' && isOwner;
  
  // Computed Project Stats
  const projectTimeSpent = activeProject ? calculateTimeSpent(activeProject.entries) : '0d';

  // Helper: Toast
  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
      setProfile(initialProfile);
      setEditForm(initialProfile);
  }, [initialProfile]);

  // Load Projects for the specific Target User (Persistence)
  useEffect(() => {
      const key = `opc_projects_${targetUser.companyName}`;
      try {
          const savedProjects = JSON.parse(localStorage.getItem(key) || '[]');
          setProjects(savedProjects);
          setActiveProject(null);
      } catch (e) {
          setProjects([]);
      }
  }, [targetUser.companyName]);

  // POLLING EFFECT FOR ALERTS (Requests & Messages)
  useEffect(() => {
    const checkAlerts = () => {
        // 1. Friend Requests Logic
        const myName = profile.companyName;
        // Count how many users follow me, that I don't follow back
        const reqCount = Object.keys(connections).filter(otherUser => {
            const theyFollowMe = connections[otherUser]?.includes(myName);
            const iFollowThem = connections[myName]?.includes(otherUser);
            return theyFollowMe && !iFollowThem;
        }).length;
        setFriendRequestsCount(reqCount);

        // 2. Message Logic
        if (isSupervisor) {
            // Supervisor: Check all followed users for replies
            const newMap: Record<string, boolean> = {};
            followedUsers.forEach(companyName => {
                const key = `opc_instructions_${companyName}`;
                try {
                    const msgs: MessageItem[] = JSON.parse(localStorage.getItem(key) || '[]');
                    if (msgs.length > 0) {
                        const last = msgs[msgs.length - 1];
                        if (last.sender === 'user' && !last.read) {
                            newMap[companyName] = true;
                        }
                    }
                } catch {}
            });
            setUserUnreadMap(newMap);
        } else {
            // User: Check for supervisor instruction
            const key = `opc_instructions_${profile.companyName}`;
            try {
                const msgs: MessageItem[] = JSON.parse(localStorage.getItem(key) || '[]');
                if (msgs.length > 0) {
                    const last = msgs[msgs.length - 1];
                    if (last.sender === 'supervisor' && !last.read) {
                        setHasUnreadSupervisorMsg(true);
                    } else {
                        setHasUnreadSupervisorMsg(false);
                    }
                } else {
                     setHasUnreadSupervisorMsg(false);
                }
            } catch {}

            // User: Check for friend messages
            // Re-calculate mutual friends for scanning (since we are inside effect/interval)
            const currentFriends = allUsers.concat(MOCK_GROUPS.filter(g => g.type === 'user') as any).filter(u => {
                if (u.companyName === profile.companyName) return false;
                const iFollow = connections[profile.companyName]?.includes(u.companyName);
                const followsMe = connections[u.companyName]?.includes(profile.companyName);
                return iFollow && followsMe;
            });

            const newUnreadPartners = new Set<string>();
            currentFriends.forEach(friend => {
                const names = [profile.companyName, friend.companyName].sort();
                const chatKey = `opc_chat_${names[0]}_${names[1]}`;
                try {
                    const msgs: MessageItem[] = JSON.parse(localStorage.getItem(chatKey) || '[]');
                    if (msgs.length > 0) {
                        const last = msgs[msgs.length - 1];
                        // If sender is Friend and NOT read
                        if (last.sender === friend.companyName && !last.read) {
                            newUnreadPartners.add(friend.companyName);
                        }
                    }
                } catch {}
            });
            setUnreadPartners(newUnreadPartners);
        }
    };

    checkAlerts(); 
    const interval = setInterval(checkAlerts, 2000); 
    return () => clearInterval(interval);
  }, [isSupervisor, followedUsers, profile.companyName, connections, allUsers]); 

  const saveProjectsToStorage = (newProjects: Project[]) => {
      const key = `opc_projects_${targetUser.companyName}`;
      localStorage.setItem(key, JSON.stringify(newProjects));
      setProjects(newProjects);
  };

  // --- OPC LETTER SYSTEM LOGIC ---

  const getChatStorageKey = (partnerName: string, isPartnerSupervisor: boolean) => {
      if (isPartnerSupervisor) {
          return `opc_instructions_${profile.companyName}`;
      }
      const names = [profile.companyName, partnerName].sort();
      return `opc_chat_${names[0]}_${names[1]}`;
  };

  const loadLetterMessages = (partnerName: string, isPartnerSupervisor: boolean) => {
      const key = getChatStorageKey(partnerName, isPartnerSupervisor);
      try {
          const msgs: MessageItem[] = JSON.parse(localStorage.getItem(key) || '[]');
          
          // Mark as read when loading (if I am the recipient)
          let hasUpdates = false;
          const updatedMsgs = msgs.map(msg => {
              // If it's the partner who sent it, mark as read
              const isPartnerSender = isPartnerSupervisor ? msg.sender === 'supervisor' : msg.sender === partnerName;
              if (isPartnerSender && !msg.read) {
                  hasUpdates = true;
                  return { ...msg, read: true };
              }
              return msg;
          });

          setLetterMessages(updatedMsgs);
          
          if (hasUpdates) {
              localStorage.setItem(key, JSON.stringify(updatedMsgs));
              if (isPartnerSupervisor) setHasUnreadSupervisorMsg(false);
              // Update local state immediately for responsiveness
              if (!isPartnerSupervisor) {
                  setUnreadPartners(prev => {
                      const next = new Set(prev);
                      next.delete(partnerName);
                      return next;
                  });
              }
          }

      } catch {
          setLetterMessages([]);
      }
  };

  const openLetterSystem = () => {
      setLetterView('inbox');
      setShowLetterModal(true);
  };

  const openChatWith = (name: string, isPartnerSupervisor: boolean) => {
      setActiveChatPartner({ name, isSupervisor: isPartnerSupervisor });
      loadLetterMessages(name, isPartnerSupervisor);
      setLetterView('chat');
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const handleSendLetter = () => {
      if (!letterInput.trim() || !activeChatPartner) return;
      
      const newMsg: MessageItem = {
          id: Date.now().toString(),
          sender: isSupervisor ? 'supervisor' : profile.companyName,
          content: letterInput,
          timestamp: Date.now(),
          read: false // New messages are unread by default
      };
      
      if (!isSupervisor && activeChatPartner.isSupervisor) {
          newMsg.sender = 'user';
      }

      const updated = [...letterMessages, newMsg];
      setLetterMessages(updated);
      
      const key = getChatStorageKey(activeChatPartner.name, activeChatPartner.isSupervisor);
      localStorage.setItem(key, JSON.stringify(updated));
      
      setLetterInput('');
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  const openSupervisorChat = (targetUser: UserProfile) => {
       const key = `opc_instructions_${targetUser.companyName}`;
       try {
          const msgs: MessageItem[] = JSON.parse(localStorage.getItem(key) || '[]');
          
          // Mark User messages as read for Supervisor
          let hasUpdates = false;
          const updatedMsgs = msgs.map(msg => {
              if (msg.sender === 'user' && !msg.read) {
                  hasUpdates = true;
                  return { ...msg, read: true };
              }
              return msg;
          });
          
          setLetterMessages(updatedMsgs);
          if (hasUpdates) {
              localStorage.setItem(key, JSON.stringify(updatedMsgs));
              // Update local unread map immediately
              setUserUnreadMap(prev => ({ ...prev, [targetUser.companyName]: false }));
          }
       } catch { setLetterMessages([]); }
       
       setActiveChatPartner({ name: targetUser.companyName, isSupervisor: false }); 
       setLetterView('chat');
       setShowLetterModal(true);
  };
  
  const handleSupervisorSend = () => {
      if (!letterInput.trim() || !activeChatPartner) return;
      const newMsg: MessageItem = {
          id: Date.now().toString(),
          sender: 'supervisor',
          content: letterInput,
          timestamp: Date.now(),
          read: false
      };
      const updated = [...letterMessages, newMsg];
      setLetterMessages(updated);
      const key = `opc_instructions_${activeChatPartner.name}`;
      localStorage.setItem(key, JSON.stringify(updated));
      setLetterInput('');
      setTimeout(() => chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
      showToast('Transmission Sent');
  };

  // --- FRIENDSHIP LOGIC ---

  const handleFollowToggle = (e: React.MouseEvent, targetName: string, isMock: boolean) => {
      e.stopPropagation();
      
      const myName = profile.companyName;
      const currentConnections = { ...connections };
      
      // Initialize arrays if they don't exist
      if (!currentConnections[myName]) currentConnections[myName] = [];
      if (!currentConnections[targetName]) currentConnections[targetName] = [];

      const isFollowing = currentConnections[myName].includes(targetName);
      const followsMe = currentConnections[targetName].includes(myName);

      if (isFollowing) {
          // Unfollow
          currentConnections[myName] = currentConnections[myName].filter(n => n !== targetName);
      } else {
          // Follow
          currentConnections[myName].push(targetName);
          
          // If it's a mock user, auto-follow back to simulate friendship
          if (isMock) {
              if (!currentConnections[targetName].includes(myName)) {
                  currentConnections[targetName].push(myName);
              }
          }
      }

      // Check if we just became friends (mutual follow)
      // We check the NEW state. 
      const nowIFollow = currentConnections[myName].includes(targetName);
      const nowFollowsMe = currentConnections[targetName].includes(myName); // For mock, this is updated above

      if (nowIFollow && nowFollowsMe && (!isFollowing)) {
         showToast(`You are now connected with ${targetName}!`);
      }

      setConnections(currentConnections);
      localStorage.setItem('opc_connections', JSON.stringify(currentConnections));
  };

  // Helper to check relationship status
  const getRelationStatus = (targetName: string) => {
      const myName = profile.companyName;
      const iFollow = connections[myName]?.includes(targetName);
      const followsMe = connections[targetName]?.includes(myName);

      if (iFollow && followsMe) return 'friend';
      if (iFollow) return 'requested';
      if (followsMe) return 'follower'; // They follow me, I don't follow back
      return 'none';
  };

  // Filter mocked groups and users for the network modal
  // Filter available friends for OPC Letter (Must be MUTUAL Friends)
  const mutualFriends = allUsers.concat(MOCK_GROUPS.filter(g => g.type === 'user') as any).filter(u => {
      if (u.companyName === profile.companyName) return false;
      return getRelationStatus(u.companyName) === 'friend';
  });

  const searchedFriends = mutualFriends.filter(u => 
      u.companyName.toLowerCase().includes(letterSearchQuery.toLowerCase())
  );

  // Combined list for "Find Friends" modal: All Users + Mock Users
  // Filter out self
  const allPotentialFriends = [...MOCK_GROUPS.filter(g => g.type === 'user'), ...allUsers].filter(u => 
      ('name' in u ? u.name : u.companyName) !== profile.companyName &&
      ('name' in u ? u.name : u.companyName).toLowerCase().includes(searchQuery.toLowerCase())
  );

  // --- GENERAL HANDLERS ---

  const handleSaveProfile = () => {
      setProfile(editForm);
      if (onUpdateProfile) {
          onUpdateProfile(editForm);
      }
      setIsEditingProfile(false);
      showToast('Profile Updated Successfully');
  };

  const handlePublishDiary = async () => { /* ... existing ... */ 
    if (!activeProject || (!diaryInput.trim() && !diaryImage)) return;
    setLoading(true);
    const { cost: detectedCost, profit: detectedProfit } = analyzeEntryFinancials(diaryInput);
    setTimeout(() => {
      const newEntry: DiaryEntry = {
        id: Date.now().toString(),
        content: diaryInput,
        images: diaryImage ? [diaryImage] : [],
        timestamp: Date.now(),
        date: new Date().toLocaleDateString(),
        comments: []
      };
      const currentCost = activeProject.stats ? parseCurrency(activeProject.stats.cost) : 0;
      const currentProfit = activeProject.stats ? parseCurrency(activeProject.stats.profit) : 0;
      const newStats: ProjectStats = {
          stage: activeProject.stats?.stage || 'Idea',
          timeSpent: calculateTimeSpent([...activeProject.entries, newEntry]),
          cost: formatCurrency(currentCost + detectedCost),
          profit: formatCurrency(currentProfit + detectedProfit)
      };
      const updated = { 
          ...activeProject, 
          entries: [newEntry, ...activeProject.entries],
          stats: newStats
      };
      setActiveProject(updated);
      const updatedProjects = projects.map(p => p.id === updated.id ? updated : p);
      saveProjectsToStorage(updatedProjects);
      setDiaryInput('');
      setDiaryImage(null);
      setLoading(false);
    }, 800);
  };

  const handleCreateProject = () => { /* ... existing ... */ 
     if(!newProjectForm.name.trim()) return;
     const newProj: Project = {
        id: Date.now().toString(),
        name: newProjectForm.name,
        description: newProjectForm.description || "A new journey begins.",
        stats: { stage: 'Idea', timeSpent: '0d', cost: '$0', profit: '$0' },
        entries: []
     };
     const updatedProjects = [...projects, newProj];
     saveProjectsToStorage(updatedProjects);
     setActiveProject(newProj);
     setShowProjectModal(false);
     setNewProjectForm({ name: '', description: '' });
  };

  const handleUpdateProjectStats = (field: keyof ProjectStats, value: string) => { /* ... existing ... */
      if (!activeProject) return;
      const updatedStats = { ...activeProject.stats, [field]: value } as ProjectStats;
      const updatedProject = { ...activeProject, stats: updatedStats };
      setActiveProject(updatedProject);
      const updatedProjects = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
      saveProjectsToStorage(updatedProjects);
  };

  const toggleEditProfile = () => {
    if (isEditingProfile) {
       setEditForm(profile);
       setIsEditingProfile(false);
    } else {
      setEditForm(profile);
      setIsEditingProfile(true);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'avatar' | 'projectCover' | 'diary') => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (field === 'diary') {
            setDiaryImage(reader.result as string);
        } else {
            setEditForm(prev => ({ ...prev, [field]: reader.result as string }));
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePostComment = (entryId: string) => { /* ... existing ... */ 
    const text = commentInputs[entryId];
    if (!text || !text.trim()) return;
    if (!activeProject) return;
    const newComment: Comment = {
      id: Date.now().toString(),
      author: isSupervisor ? 'Supervisor' : profile.companyName,
      content: text,
      isOwner: viewMode === 'home',
      avatar: isSupervisor ? 'https://ui-avatars.com/api/?name=Supervisor&background=000&color=fff' : (profile.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest')
    };
    const updatedEntries = activeProject.entries.map(e => {
      if (e.id === entryId) {
        return { ...e, comments: [...e.comments, newComment] };
      }
      return e;
    });
    const updatedProject = { ...activeProject, entries: updatedEntries };
    setActiveProject(updatedProject);
    const updatedProjects = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
    saveProjectsToStorage(updatedProjects);
    setCommentInputs(prev => ({ ...prev, [entryId]: '' }));
    setExpandedComments(prev => ({ ...prev, [entryId]: true }));
  };

  const toggleCommentExpansion = (entryId: string) => {
    setExpandedComments(prev => ({ ...prev, [entryId]: !prev[entryId] }));
  };

  // DIARY ENTRY EDIT & DELETE HANDLERS
  const startEditingEntry = (entry: DiaryEntry) => {
      setEditingEntryId(entry.id);
      setEditingContent(entry.content);
  };

  const cancelEditingEntry = () => {
      setEditingEntryId(null);
      setEditingContent('');
  };

  const saveEditingEntry = (entryId: string) => {
      if (!activeProject) return;
      const updatedEntries = activeProject.entries.map(e => {
          if (e.id === entryId) {
              return { ...e, content: editingContent };
          }
          return e;
      });
      const updatedProject = { ...activeProject, entries: updatedEntries };
      setActiveProject(updatedProject);
      const updatedProjects = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
      saveProjectsToStorage(updatedProjects);
      setEditingEntryId(null);
      setEditingContent('');
      showToast('Log Updated');
  };

  const handleDeleteEntry = (entryId: string) => {
      if (!window.confirm("Delete this diary entry? This cannot be undone.")) return;
      if (!activeProject) return;
      
      const updatedEntries = activeProject.entries.filter(e => e.id !== entryId);
      const updatedProject = { ...activeProject, entries: updatedEntries };
      setActiveProject(updatedProject);
      const updatedProjects = projects.map(p => p.id === updatedProject.id ? updatedProject : p);
      saveProjectsToStorage(updatedProjects);
      showToast('Log Deleted');
  };
  
  const handleFollowUser = (e: React.MouseEvent, name: string) => {
      e.stopPropagation();
      const newSet = followedUsers.includes(name) ? followedUsers : [...followedUsers, name];
      setFollowedUsers(newSet);
      localStorage.setItem('opc_supervisor_following', JSON.stringify(newSet));
      setShowSupervisorSearch(false);
  };

  const supervisorSearchResults = allUsers.filter(u => 
      u.companyName.toLowerCase().includes(supervisorQuery.toLowerCase())
  );

  const visibleEntries = activeProject 
    ? (isDiaryExpanded ? activeProject.entries : activeProject.entries.slice(0, 5))
    : [];

  const handleVisitGroup = (group: Group) => {
    const fakeProfile: UserProfile = {
      companyName: group.name,
      description: group.description,
      devTime: '1 Year',
      audience: '10K',
      valuation: '$5M',
      avatar: group.avatar.startsWith('#') ? null : group.avatar,
      projectUrl: 'https://example.com',
      password: '',
      title: group.type === 'group' ? 'Clan Leader' : 'Founder'
    };
    setGuestProfile(fakeProfile);
    setViewMode('guest');
    setShowNetworkModal(false);
    setActiveProject(null); 
  };

  const handleVisitUser = (user: UserProfile) => {
      setGuestProfile(user);
      setViewMode('guest');
      setShowNetworkModal(false);
      setShowSupervisorSearch(false);
      setActiveProject(null);
  };

  // SUPERVISOR HUB RENDER
  if (viewMode === 'supervisor-hub' && isSupervisor) {
      const followingList = allUsers.filter(u => followedUsers.includes(u.companyName));
      return (
        <div className="min-h-screen bg-stone-900 p-8 pb-20">
            {toast && (
                <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-emerald-500 text-white px-6 py-3 rounded-full shadow-xl z-[100] animate-in fade-in slide-in-from-bottom-2">
                    <div className="flex items-center gap-2">
                        <Check size={16} className="text-white" />
                        <span className="text-xs font-bold uppercase tracking-widest">{toast.msg}</span>
                    </div>
                </div>
            )}
            <div className="max-w-5xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-lg">
                       <Crown size={20} className="text-stone-900" />
                     </div>
                     <div>
                         <h1 className="text-2xl font-black tracking-tighter text-white">SUPERVISOR</h1>
                         <p className="text-stone-500 font-mono text-xs uppercase tracking-widest">Control Center</p>
                     </div>
                   </div>
                   <button onClick={onReset} className="text-stone-400 hover:text-white flex items-center gap-2 text-xs font-bold uppercase">
                       Log Out <LogOut size={14} />
                   </button>
                </div>
                <div className="flex justify-end mb-12">
                     <button 
                        onClick={() => setViewMode('forum')}
                        className="px-6 py-2.5 rounded-full bg-stone-800 text-white border border-stone-700 hover:border-white text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2"
                     >
                        Forum <MessageSquare size={12} />
                     </button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                    <button 
                        onClick={() => setShowSupervisorSearch(true)}
                        className="aspect-square rounded-[2rem] border-2 border-dashed border-stone-700 hover:border-white hover:bg-stone-800 transition-all flex flex-col items-center justify-center gap-2 group"
                    >
                        <div className="bg-stone-800 p-3 rounded-full text-stone-500 group-hover:bg-white group-hover:text-stone-900 transition-colors">
                            <Plus size={24} />
                        </div>
                        <span className="text-stone-500 font-black text-xs uppercase tracking-widest group-hover:text-white">Track User</span>
                    </button>
                    {followingList.map(user => (
                        <div 
                            key={user.companyName} 
                            onClick={() => handleVisitUser(user)}
                            className="aspect-square rounded-[2rem] bg-stone-800 p-4 flex flex-col items-center justify-between cursor-pointer hover:bg-stone-700 transition-all group relative overflow-hidden"
                        >
                            {userUnreadMap[user.companyName] && (
                                <div className="absolute top-2 right-2 w-3 h-3 bg-rose-500 rounded-full animate-pulse shadow-sm z-20" title="New Reply"></div>
                            )}
                            <div className="w-full flex flex-col items-center gap-3">
                                <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-stone-600 group-hover:border-white transition-colors">
                                    {user.avatar ? <img src={user.avatar} className="w-full h-full object-cover" /> : (
                                        <div className="w-full h-full bg-stone-700 flex items-center justify-center text-white font-bold">{user.companyName[0]}</div>
                                    )}
                                </div>
                                <div className="text-center z-10 w-full">
                                    <h3 className="text-white font-bold text-xs truncate w-full">{user.companyName}</h3>
                                    <p className="text-stone-500 text-[9px] font-mono uppercase tracking-widest">Active</p>
                                </div>
                            </div>
                            <div className="w-full flex gap-2 mt-auto">
                                <button 
                                    onClick={(e) => { e.stopPropagation(); openSupervisorChat(user); }}
                                    className="flex-1 bg-stone-900 hover:bg-rose-600 text-white text-[9px] py-2 rounded-lg font-bold uppercase tracking-wider flex items-center justify-center gap-2 border border-stone-700 hover:border-rose-500 transition-all"
                                >
                                    <Zap size={10} /> Chat
                                </button>
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        if (window.confirm(`Are you sure you want to permanently delete user "${user.companyName}"? This action cannot be undone.`)) {
                                            onDeleteUser?.(user.companyName);
                                        }
                                    }}
                                    className="bg-rose-950/50 hover:bg-rose-600 text-rose-500 hover:text-white p-2 rounded-lg transition-colors border border-rose-900/50 hover:border-rose-500"
                                    title="Delete User"
                                >
                                    <Trash2 size={12} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            {/* Reuse Letter Modal for Supervisor Chat View Only */}
            {showLetterModal && activeChatPartner && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                     <div className="bg-stone-900 w-full max-w-md h-[600px] rounded-3xl flex flex-col relative border border-stone-700 shadow-2xl overflow-hidden">
                        <div className="p-4 border-b border-stone-800 flex justify-between items-center bg-stone-900 z-10">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-rose-600 flex items-center justify-center text-white font-bold">
                                    <Zap size={20} />
                                </div>
                                <div>
                                    <h3 className="text-white font-bold text-sm uppercase tracking-wide">Secure Line</h3>
                                    <p className="text-stone-500 text-[10px] font-mono">Target: {activeChatPartner.name}</p>
                                </div>
                            </div>
                            <button onClick={() => setShowLetterModal(false)} className="text-stone-500 hover:text-white p-2"><X size={20} /></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-900 custom-scrollbar">
                            {letterMessages.length === 0 && (
                                <div className="text-center py-8 opacity-30">
                                    <Database size={32} className="mx-auto mb-2 text-stone-500" />
                                    <p className="text-stone-500 text-xs font-mono uppercase">Empty Log</p>
                                </div>
                            )}
                            {letterMessages.map(msg => (
                                <div key={msg.id} className={`flex w-full ${msg.sender === 'supervisor' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium leading-relaxed ${
                                        msg.sender === 'supervisor' 
                                        ? 'bg-rose-600 text-white rounded-br-none' 
                                        : 'bg-stone-800 text-stone-200 rounded-bl-none border border-stone-700'
                                    }`}>
                                        <p>{msg.content}</p>
                                        <span className="block text-[8px] opacity-50 mt-1 text-right font-mono">
                                            {new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}
                                        </span>
                                    </div>
                                </div>
                            ))}
                            <div ref={chatBottomRef} />
                        </div>
                        <div className="p-4 bg-stone-900 border-t border-stone-800">
                             <div className="flex gap-2">
                                 <input 
                                    autoFocus
                                    value={letterInput}
                                    onChange={(e) => setLetterInput(e.target.value)}
                                    placeholder="Transmit order..."
                                    className="flex-1 bg-stone-800 text-white text-xs p-3 rounded-xl outline-none focus:ring-1 focus:ring-rose-500 border border-transparent placeholder:text-stone-600"
                                    onKeyDown={(e) => e.key === 'Enter' && handleSupervisorSend()}
                                 />
                                 <button 
                                    onClick={handleSupervisorSend}
                                    disabled={!letterInput.trim()}
                                    className="bg-white text-stone-900 p-3 rounded-xl hover:bg-stone-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                 >
                                     <Send size={16} />
                                 </button>
                             </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Supervisor Search Modal */}
             {showSupervisorSearch && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
                    <div className="bg-stone-900 border border-stone-700 rounded-[2rem] p-8 max-w-lg w-full relative">
                         <button onClick={() => setShowSupervisorSearch(false)} className="absolute top-6 right-6 text-stone-500 hover:text-white"><X size={20}/></button>
                         <h3 className="text-white font-black text-xl mb-6">Track Real User</h3>
                         <div className="relative mb-6">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-500" size={16} />
                            <input 
                                autoFocus
                                value={supervisorQuery}
                                onChange={(e) => setSupervisorQuery(e.target.value)}
                                placeholder="Search user name..."
                                className="w-full bg-stone-800 border border-stone-700 rounded-xl py-3 pl-12 pr-4 text-white outline-none focus:border-stone-500"
                            />
                         </div>
                         <div className="space-y-2 max-h-60 overflow-y-auto">
                             {supervisorSearchResults.map(user => (
                                 <div key={user.companyName} className="flex items-center justify-between p-3 rounded-xl bg-stone-800 hover:bg-stone-700 cursor-pointer" onClick={() => handleVisitUser(user)}>
                                     <div className="flex items-center gap-3">
                                         {user.avatar ? <img src={user.avatar} className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 bg-stone-600 rounded-full"/>}
                                         <span className="text-white font-bold text-sm">{user.companyName}</span>
                                     </div>
                                     <div className="flex items-center gap-2">
                                         {followedUsers.includes(user.companyName) ? (
                                             <span className="text-stone-500 text-xs font-mono mr-2">Tracking</span>
                                         ) : (
                                             <button 
                                                onClick={(e) => handleFollowUser(e, user.companyName)}
                                                className="bg-white text-stone-900 px-3 py-1 rounded-lg text-xs font-bold uppercase"
                                             >
                                                 Track
                                             </button>
                                         )}
                                          <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (window.confirm(`Are you sure you want to permanently delete user "${user.companyName}"? This action cannot be undone.`)) {
                                                    onDeleteUser?.(user.companyName);
                                                }
                                            }}
                                            className="bg-rose-950/30 text-rose-500 hover:bg-rose-600 hover:text-white p-1.5 rounded-lg transition-colors"
                                            title="Delete User"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                     </div>
                                 </div>
                             ))}
                             {supervisorSearchResults.length === 0 && <p className="text-stone-600 text-center text-xs">No users found in database</p>}
                         </div>
                    </div>
                </div>
            )}
        </div>
      );
  }

  // --- REGULAR USER RENDER ---

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-4 md:p-8 pb-20">
      
      {toast && (
          <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-stone-900 text-white px-6 py-3 rounded-full shadow-xl z-[100] animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center gap-2">
                  <Check size={16} className="text-emerald-400" />
                  <span className="text-xs font-bold uppercase tracking-widest">{toast.msg}</span>
              </div>
          </div>
      )}

      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-6">
           <div className="flex items-center gap-3 cursor-pointer" onClick={() => isSupervisor ? setViewMode('supervisor-hub') : setViewMode('home')}>
             <div className={`w-8 h-8 rounded-lg flex items-center justify-center shadow-lg ${isSupervisor ? 'bg-rose-600' : 'bg-stone-900'}`}>
               <span className="text-white font-black text-xs">OPC</span>
             </div>
             <h1 className="text-xl font-black tracking-tighter">DIARY {isSupervisor && <span className="text-rose-500 text-sm ml-2 font-mono">SUPERVISOR MODE</span>}</h1>
           </div>
           <div className="flex items-center gap-4">
              <button 
                onClick={onReset} 
                className="bg-white border border-stone-200 text-stone-500 hover:text-stone-900 hover:border-stone-900 px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2"
              >
                Log Out <LogOut size={12} />
              </button>
           </div>
        </div>

        {!(isSupervisor && viewMode === 'guest') && (
            <div className="mb-6 flex justify-between items-center relative z-40">
                <button 
                    onClick={() => setShowNetworkModal(true)}
                    className="flex bg-white rounded-full border border-stone-200 px-5 py-2.5 items-center gap-2 hover:bg-stone-50 hover:border-stone-300 transition-all shadow-sm relative"
                >
                    <Users size={16} className="text-stone-400" />
                    <span className="text-[10px] font-bold uppercase tracking-widest text-stone-600">Find Friends</span>
                    {friendRequestsCount > 0 && (
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-rose-500 text-[8px] font-bold text-white ring-2 ring-white">
                            {friendRequestsCount}
                        </span>
                    )}
                </button>

                <div className="flex items-center gap-3">
                    {/* User's OPC Letter Button */}
                    {!isSupervisor && (
                        <button 
                           onClick={openLetterSystem}
                           className="px-4 py-2.5 rounded-full bg-stone-50 text-stone-800 border border-stone-200 hover:bg-white hover:border-stone-300 text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 relative shadow-sm"
                        >
                           <Mail size={12} className="fill-current" />
                           OPC Letter
                           {(hasUnreadSupervisorMsg || unreadPartners.size > 0) && (
                               <span className="absolute -top-1 -right-1 w-3 h-3 bg-rose-600 border-2 border-white rounded-full animate-bounce"></span>
                           )}
                        </button>
                    )}

                    <button 
                        onClick={() => setViewMode(viewMode === 'forum' ? 'home' : 'forum')}
                        className={`px-6 py-2.5 rounded-full border text-[10px] font-bold uppercase tracking-widest transition-all flex items-center gap-2 shadow-sm
                            ${viewMode === 'forum' ? 'bg-white border-stone-200 text-stone-500 hover:border-stone-800 hover:text-stone-800' : 'bg-stone-900 text-white border-stone-900'}
                        `}
                    >
                        {viewMode === 'forum' ? 'Diary' : 'Forum'} 
                        {viewMode === 'forum' ? <Layout size={12} /> : <MessageSquare size={12} />} 
                    </button>
                </div>
            </div>
        )}
        
        {viewMode === 'forum' ? (
           <Forum userProfile={profile} onImageClick={setImagePreview} />
        ) : (
          <>
            {(viewMode === 'guest' || isSupervisor) && (
               <div className="mb-6 flex items-center gap-2 fade-in-up">
                  <button onClick={() => isSupervisor ? setViewMode('supervisor-hub') : setViewMode('home')} className="flex items-center gap-2 text-stone-400 hover:text-stone-800 text-xs font-bold uppercase tracking-wider bg-white px-3 py-1.5 rounded-lg border border-stone-100 shadow-sm transition-all">
                     <ArrowLeft size={12} /> {isSupervisor ? 'Back to Hub' : 'Back to My Diary'}
                  </button>
                  <span className="text-stone-300 text-xs">|</span>
                  <span className="text-stone-400 text-xs font-mono uppercase">Viewing Guest Profile</span>
               </div>
            )}
            {/* ... Rest of Dashboard ... */}
            <div className={`bg-white rounded-[2rem] p-5 shadow-lg shadow-stone-200/50 border border-stone-100 relative overflow-hidden mb-8 group/card fade-in-up ${viewMode === 'guest' ? 'ring-2 ring-stone-900/5' : ''}`}>
                {canEdit && (
                  <button 
                    onClick={isEditingProfile ? handleSaveProfile : toggleEditProfile}
                    className={`absolute top-3 right-3 z-30 p-1.5 rounded-lg transition-all shadow-sm border 
                      ${isEditingProfile 
                        ? 'bg-emerald-500 text-white border-emerald-500 hover:bg-emerald-600' 
                        : 'bg-white text-stone-400 border-stone-100 hover:text-stone-800 hover:border-stone-200'}
                    `}
                  >
                    {isEditingProfile ? <Save size={12} /> : <Edit2 size={12} />}
                  </button>
                )}
                {/* Profile content reuse */}
                <div className="flex flex-col sm:flex-row gap-5 items-stretch relative z-10">
                    <div className="flex items-center gap-4 pr-5 sm:border-r border-stone-100 shrink-0">
                        <div className="relative group w-16 h-16 rounded-xl overflow-hidden border-2 border-stone-100 bg-stone-50 shadow-sm shrink-0">
                            {displayProfile.avatar ? (
                                <img src={isEditingProfile ? editForm.avatar || '' : displayProfile.avatar || ''} className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full bg-stone-200 flex items-center justify-center">
                                    <span className="text-xl font-bold text-stone-400">{displayProfile.companyName[0]}</span>
                                </div>
                            )}
                            {isEditingProfile && (
                                <label className="absolute inset-0 bg-black/40 flex items-center justify-center cursor-pointer opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Camera className="text-white" size={14} />
                                  <input type="file" accept="image/*" className="hidden" onChange={(e) => handleImageUpload(e, 'avatar')} />
                                </label>
                            )}
                        </div>
                        <div className="flex flex-col justify-center min-w-[100px] max-w-[140px]">
                            {isEditingProfile ? (
                                <input 
                                  value={editForm.companyName}
                                  onChange={(e) => setEditForm({...editForm, companyName: e.target.value})}
                                  className="text-base font-black uppercase bg-stone-50 border-b border-stone-300 outline-none w-full"
                                  placeholder="Name"
                                />
                            ) : (
                                <h2 
                                    className="text-base font-black tracking-tight uppercase text-stone-800 leading-none mb-1 truncate cursor-pointer hover:text-blue-600 transition-colors"
                                    onClick={() => !isEditingProfile && setInfoPopup({ label: 'Company Name', value: displayProfile.companyName })}
                                >
                                    {displayProfile.companyName}
                                </h2>
                            )}
                            {isEditingProfile ? (
                                <input 
                                  value={editForm.title || 'Solo Founder'}
                                  onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                                  className="text-[10px] font-black uppercase tracking-widest bg-stone-50 border-b border-stone-200 outline-none text-stone-400 w-full mt-1"
                                  placeholder="Title"
                                />
                            ) : (
                                <span className="text-[8px] font-black text-stone-400 uppercase tracking-widest mt-1 block">
                                    {displayProfile.title || 'Solo Founder'}
                                </span>
                            )}
                        </div>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
                        <div className="w-full">
                            {isEditingProfile ? (
                                <input 
                                  value={editForm.description}
                                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                                  className="w-full bg-stone-50 text-xs p-1.5 rounded border border-stone-200 outline-none font-medium text-stone-600"
                                  placeholder="Short Description"
                                />
                            ) : (
                                <p 
                                    className="text-xs text-stone-500 font-medium truncate cursor-pointer hover:bg-stone-50 rounded px-1 -ml-1 transition-colors"
                                    onClick={() => setInfoPopup({ label: 'Description', value: displayProfile.description })}
                                >
                                    "{displayProfile.description}"
                                </p>
                            )}
                        </div>
                        <div className="grid grid-cols-3 gap-2 w-full">
                            <StatItem icon={DollarSign} label="Valuation" value={displayProfile.valuation} field="valuation" color="text-blue-500" isEditingProfile={isEditingProfile} editForm={editForm} setEditForm={setEditForm} setInfoPopup={setInfoPopup} />
                            <StatItem icon={Clock} label="Launch" value={displayProfile.devTime} field="devTime" color="text-orange-500" isEditingProfile={isEditingProfile} editForm={editForm} setEditForm={setEditForm} setInfoPopup={setInfoPopup} />
                            <StatItem icon={TrendingUp} label="Users" value={displayProfile.audience} field="audience" color="text-emerald-500" isEditingProfile={isEditingProfile} editForm={editForm} setEditForm={setEditForm} setInfoPopup={setInfoPopup} />
                        </div>
                    </div>
                    <div className="sm:w-32 shrink-0 flex flex-col">
                        <div className="flex-1 rounded-lg bg-stone-900 text-white relative overflow-hidden group/link flex flex-col justify-center items-center p-2 min-h-[60px]">
                            {(isEditingProfile ? editForm.projectCover : displayProfile.projectCover) && (
                                <div className="absolute inset-0 opacity-40">
                                    <img src={isEditingProfile ? editForm.projectCover! : displayProfile.projectCover!} className="w-full h-full object-cover" />
                                </div>
                            )}
                            <div className="relative z-10 flex flex-col items-center gap-1 text-center">
                                {isEditingProfile ? (
                                    <>
                                      <label className="cursor-pointer hover:scale-110 transition-transform p-1">
                                        <Upload size={10} />
                                        <input type="file" className="hidden" onChange={(e) => handleImageUpload(e, 'projectCover')} />
                                      </label>
                                      <input 
                                        value={editForm.projectUrl || ''}
                                        onChange={(e) => setEditForm({...editForm, projectUrl: e.target.value})}
                                        placeholder="Link"
                                        className="bg-transparent border-b border-white/30 text-[9px] text-center w-full outline-none text-white"
                                      />
                                    </>
                                ) : (
                                    <a href={displayProfile.projectUrl || '#'} target="_blank" className="flex flex-col items-center gap-1">
                                        <span className="text-[8px] font-black uppercase tracking-widest opacity-80">VISIT</span>
                                        <ExternalLink size={12} />
                                    </a>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Archive and Diary UI Logic reuse from previous code (shortened for brevity but functionality preserved) */}
            {!activeProject ? (
              <div className="fade-in-up">
                <div className="flex items-center justify-between mb-6 px-2">
                  <div className="flex items-center gap-4">
                    <h3 className="text-xs font-black uppercase tracking-[0.4em] text-stone-300">Project Archive</h3>
                    <span className="bg-stone-100 text-stone-400 text-[10px] font-bold px-2 py-1 rounded-md">{projects.length}</span>
                  </div>
                  <div className="h-px bg-stone-100 flex-1 mx-8" />
                  {canEdit && (
                    <button onClick={() => setShowProjectModal(true)} className="md:hidden p-2 bg-stone-900 text-white rounded-full">
                      <Plus size={20} />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {projects.map(p => (
                    <div 
                      key={p.id} 
                      onClick={() => setActiveProject(p)}
                      className="bg-white p-8 rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all cursor-pointer group relative overflow-hidden flex flex-col min-h-[14rem]"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-black group-hover:text-blue-600 transition-colors uppercase tracking-tight leading-tight line-clamp-1">{p.name}</h3>
                        <Trash2 size={16} className="text-stone-200 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <p className="text-stone-400 font-medium text-xs line-clamp-3 mb-6 leading-relaxed italic flex-1">
                        "{p.description}"
                      </p>
                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-[9px] font-mono font-black bg-stone-50 px-3 py-1.5 rounded-lg text-stone-400 border border-stone-100 uppercase">
                          {p.entries.length} LOGS
                        </span>
                        <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center group-hover:bg-stone-900 group-hover:text-white transition-all shadow-inner">
                          <ArrowLeft size={14} className="rotate-180" />
                        </div>
                      </div>
                    </div>
                  ))}
                  {projects.length === 0 && (
                     <div className="col-span-3 py-12 text-center text-stone-300">
                         <div className="mb-2 uppercase tracking-widest text-xs">No Projects Found</div>
                         {viewMode === 'guest' && <p className="text-[10px]">This user has not started any projects yet.</p>}
                     </div>
                  )}
                  {canEdit && (
                    <button 
                      onClick={() => setShowProjectModal(true)}
                      className="border-2 border-dashed border-stone-200 rounded-[2rem] p-8 flex flex-col items-center justify-center gap-4 text-stone-300 hover:border-stone-800 hover:text-stone-800 hover:bg-white transition-all group min-h-[14rem]"
                    >
                      <div className="w-14 h-14 rounded-full border border-dashed border-stone-300 flex items-center justify-center group-hover:border-stone-800 transition-all">
                        <Plus size={24} className="group-hover:scale-110 transition-transform" />
                      </div>
                      <span className="font-black text-[9px] uppercase tracking-[0.3em]">Ignite New Project</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
                /* Diary View reused */
                <div className="fade-in-up">
                    <button onClick={() => { setActiveProject(null); setIsDiaryExpanded(false); }} className="mb-8 flex items-center gap-3 text-stone-400 hover:text-stone-800 font-black text-xs uppercase tracking-[0.3em] transition-all group">
                        <div className="p-2 bg-white rounded-lg border border-stone-100 group-hover:border-stone-800 transition-colors"><ArrowLeft size={16} /></div>{t.backToArchive}
                    </button>
                    <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-stone-100 shadow-xl relative overflow-hidden">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                            <div className="flex-1">
                                <div className="flex items-center gap-4 mb-2"><h3 className="text-3xl font-black uppercase tracking-tighter leading-none">{activeProject.name}</h3><div className="h-2 w-2 rounded-full bg-blue-500"></div></div>
                                <p className="text-stone-400 font-medium text-lg italic max-w-2xl leading-relaxed">{activeProject.description}</p>
                            </div>
                        </div>
                        {canEdit && (
                            <div className="mb-16">
                                <div className="relative group">
                                    <textarea value={diaryInput} onChange={(e) => setDiaryInput(e.target.value)} placeholder={t.writeDiary} className="w-full h-32 bg-stone-50 rounded-[2rem] p-6 outline-none focus:ring-[8px] ring-stone-100/40 transition-all font-medium text-lg border border-stone-100 shadow-inner resize-none placeholder:text-stone-300" />
                                    {diaryImage && <div className="absolute bottom-20 left-6 h-12 w-12 rounded-lg overflow-hidden border-2 border-white shadow-md"><img src={diaryImage} className="w-full h-full object-cover" /><button onClick={() => setDiaryImage(null)} className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity"><X size={12} className="text-white" /></button></div>}
                                    <div className="absolute bottom-4 right-4 flex gap-2">
                                        <input type="file" hidden ref={diaryFileRef} accept="image/*" onChange={(e) => handleImageUpload(e, 'diary')} />
                                        <button onClick={() => diaryFileRef.current?.click()} className={`p-3 rounded-xl shadow-sm border transition-all hover:scale-105 ${diaryImage ? 'bg-blue-50 border-blue-200 text-blue-500' : 'bg-white border-stone-100 text-stone-400 hover:text-stone-800'}`}><ImageIcon size={18} /></button>
                                        <button onClick={handlePublishDiary} disabled={loading || (!diaryInput.trim() && !diaryImage)} className="px-6 bg-stone-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-black transition-all disabled:opacity-20 shadow-lg shadow-stone-200">{loading ? '...' : t.publish} <Send size={14} /></button>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div className="w-full space-y-4">
                            <div className="flex items-center gap-6 mb-8 justify-center"><div className="h-px w-12 bg-stone-200" /><h4 className="text-[9px] font-black uppercase tracking-[0.5em] text-stone-300">Timeline</h4><div className="h-px w-12 bg-stone-200" /></div>
                            {activeProject.entries.length === 0 ? <div className="py-12 text-center"><p className="text-stone-200 font-mono text-xs uppercase tracking-[0.3em] italic">Start your journey</p></div> : 
                                <>
                                    {visibleEntries.map((entry) => {
                                        const visibleComments = expandedComments[entry.id] ? entry.comments : entry.comments.slice(0, 2);
                                        const isEditingEntry = editingEntryId === entry.id;

                                        return (
                                            <div key={entry.id} className="flex gap-4 group/entry w-full">
                                                <div className="w-16 text-right pt-2 shrink-0"><span className="block text-xs font-black text-stone-800">{entry.date}</span><span className="block text-[10px] font-mono text-stone-400 mt-1">{new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
                                                <div className="flex-1 bg-stone-50 rounded-xl p-4 border border-stone-100 hover:border-stone-200 hover:bg-white hover:shadow-md transition-all relative group/card">
                                                    
                                                    {/* RESTORED ENTRY CONTROLS */}
                                                    {canEdit && !isEditingEntry && (
                                                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity z-10">
                                                            <button 
                                                                onClick={() => startEditingEntry(entry)} 
                                                                className="p-1.5 rounded-lg bg-white border border-stone-100 text-stone-400 hover:text-blue-500 hover:border-blue-200 shadow-sm"
                                                                title="Edit"
                                                            >
                                                                <Edit2 size={12} />
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteEntry(entry.id)} 
                                                                className="p-1.5 rounded-lg bg-white border border-stone-100 text-stone-400 hover:text-rose-500 hover:border-rose-200 shadow-sm"
                                                                title="Delete"
                                                            >
                                                                <Trash2 size={12} />
                                                            </button>
                                                        </div>
                                                    )}

                                                    {isEditingEntry ? (
                                                        <div className="animate-in fade-in">
                                                            <textarea 
                                                                value={editingContent}
                                                                onChange={(e) => setEditingContent(e.target.value)}
                                                                className="w-full bg-white p-3 rounded-lg border border-blue-200 outline-none text-sm text-stone-700 min-h-[100px] mb-2 focus:ring-2 ring-blue-50"
                                                                autoFocus
                                                            />
                                                            <div className="flex justify-end gap-2">
                                                                <button onClick={cancelEditingEntry} className="text-[10px] font-bold text-stone-400 hover:text-stone-600 px-3 py-1">Cancel</button>
                                                                <button onClick={() => saveEditingEntry(entry.id)} className="bg-stone-900 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-black"><Save size={10} /> Update Log</button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <>
                                                            <p className="text-sm text-stone-700 font-medium leading-relaxed whitespace-pre-wrap break-words">{entry.content}</p>
                                                            {entry.images && entry.images.length > 0 && <div className="mt-3 flex justify-start"><div className="w-10 h-10 rounded-lg overflow-hidden border border-stone-200 cursor-zoom-in hover:scale-105 transition-transform relative group/img shadow-sm" onClick={() => setImagePreview(entry.images[0])}><img src={entry.images[0]} className="w-full h-full object-cover" /><div className="absolute inset-0 bg-black/10 group-hover/img:bg-transparent transition-colors" /></div></div>}
                                                            <div className="mt-4 pt-3 border-t border-stone-100">
                                                                {entry.comments.length > 0 && <div className="space-y-1 mb-2">{visibleComments.map(c => <div key={c.id} className="flex gap-2"><img src={c.avatar} className="w-4 h-4 rounded-full" /><div className="bg-white px-2 py-0.5 rounded-r-md rounded-bl-md border border-stone-100 text-[10px] text-stone-600 break-words flex-1">{c.content}</div></div>)}{entry.comments.length > 2 && <button onClick={() => toggleCommentExpansion(entry.id)} className="text-[9px] font-bold text-stone-400 hover:text-stone-800 ml-6 flex items-center gap-1 mt-1">{expandedComments[entry.id] ? "Collapse" : `View ${entry.comments.length - 2} more`}</button>}</div>}
                                                                <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full bg-stone-200 shrink-0 overflow-hidden">{profile.avatar && <img src={profile.avatar} className="w-full h-full object-cover" />}</div><div className="flex-1 relative"><input value={commentInputs[entry.id] || ''} onChange={(e) => setCommentInputs({...commentInputs, [entry.id]: e.target.value})} placeholder={t.commentPlaceholder} className="w-full bg-transparent text-[10px] border-b border-stone-200 focus:border-stone-400 outline-none py-1 placeholder:text-stone-300" onKeyDown={(e) => e.key === 'Enter' && handlePostComment(entry.id)} /><button onClick={() => handlePostComment(entry.id)} disabled={!commentInputs[entry.id]} className="absolute right-0 top-1/2 -translate-y-1/2 text-stone-300 hover:text-blue-500 disabled:opacity-0 transition-all"><Send size={10} /></button></div></div>
                                                            </div>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {activeProject.entries.length > 5 && <div className="flex justify-center pt-4"><button onClick={() => setIsDiaryExpanded(!isDiaryExpanded)} className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-stone-200 text-[10px] font-bold uppercase tracking-widest text-stone-500 hover:text-stone-800 hover:border-stone-400 transition-all shadow-sm">{isDiaryExpanded ? <>Collapse <ChevronUp size={12} /></> : <>Expand History ({activeProject.entries.length - 5} More) <ChevronDown size={12} /></>}</button></div>}
                                </>
                            }
                        </div>
                        <div className="mt-16 pt-8 border-t border-stone-50">
                            <h4 className="text-[9px] font-black uppercase tracking-[0.5em] text-stone-300 mb-6 text-center">Roadmap</h4>
                            {activeProject.stats && <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"><div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex flex-col items-center justify-center gap-2 group hover:border-blue-200 transition-colors"><div className="flex items-center gap-2 text-stone-400"><Target size={14} /><span className="text-[9px] font-black uppercase tracking-widest">{t.stage || 'Stage'}</span></div>{canEdit ? <input className="text-center font-black text-lg text-stone-800 w-full outline-none bg-transparent placeholder:text-stone-200" placeholder="Idea" value={activeProject.stats.stage} onChange={(e) => handleUpdateProjectStats('stage', e.target.value)} /> : <span className="font-black text-lg text-stone-800">{activeProject.stats.stage}</span>}</div><div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex flex-col items-center justify-center gap-2 group hover:border-orange-200 transition-colors"><div className="flex items-center gap-2 text-stone-400"><Hourglass size={14} /><span className="text-[9px] font-black uppercase tracking-widest">{t.timeSpent || 'Time'}</span></div><span className="font-black text-lg text-stone-800">{projectTimeSpent}</span></div><div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex flex-col items-center justify-center gap-2 group hover:border-rose-200 transition-colors"><div className="flex items-center gap-2 text-stone-400"><Coins size={14} /><span className="text-[9px] font-black uppercase tracking-widest">{t.cost || 'Cost'}</span></div>{canEdit ? <input className="text-center font-black text-lg text-stone-800 w-full outline-none bg-transparent placeholder:text-stone-200" placeholder="$0" value={activeProject.stats.cost} onChange={(e) => handleUpdateProjectStats('cost', e.target.value)} /> : <span className="font-black text-lg text-stone-800">{activeProject.stats.cost}</span>}</div><div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex flex-col items-center justify-center gap-2 group hover:border-emerald-200 transition-colors"><div className="flex items-center gap-2 text-stone-400"><Wallet size={14} /><span className="text-[9px] font-black uppercase tracking-widest">{t.profit || 'Profit'}</span></div>{canEdit ? <input className="text-center font-black text-lg text-stone-800 w-full outline-none bg-transparent placeholder:text-stone-200" placeholder="$0" value={activeProject.stats.profit} onChange={(e) => handleUpdateProjectStats('profit', e.target.value)} /> : <span className="font-black text-lg text-stone-800">{activeProject.stats.profit}</span>}</div></div>}
                            <Roadmap entries={[...activeProject.entries].reverse()} lang={lang} onImageClick={setImagePreview} />
                        </div>
                    </div>
                </div>
            )}
          </>
        )}
        
        {/* Footer */}
        <div className="mt-24 pb-12 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 bg-white px-5 py-2 rounded-full border border-stone-100 shadow-sm">
             <div className={`w-1.5 h-1.5 rounded-full ${loading ? 'bg-amber-400 animate-pulse' : 'bg-emerald-500'}`}></div>
             <span className="text-stone-400 font-mono text-[9px] uppercase tracking-[0.3em]">
               {loading ? 'Syncing...' : 'Sync Active'}
             </span>
          </div>
          <p className="text-stone-200 font-mono text-[8px] uppercase tracking-[0.5em]">OPC ENGINE V1.4</p>
        </div>

        {/* --- MODALS --- */}
        {showProjectModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl relative">
                    <button onClick={() => setShowProjectModal(false)} className="absolute top-6 right-6 p-2 rounded-full bg-stone-50 text-stone-400 hover:bg-stone-100 hover:text-stone-800 transition-colors"><X size={20} /></button>
                    <div className="mb-8">
                        <div className="w-12 h-12 rounded-xl bg-stone-900 text-white flex items-center justify-center mb-4 shadow-lg"><Plus size={24} /></div>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-stone-800">Ignite New Project</h2>
                        <p className="text-stone-400 font-medium italic mt-2">Define the legacy you want to build.</p>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-stone-300 mb-2">Project Name</label>
                            <input autoFocus value={newProjectForm.name} onChange={(e) => setNewProjectForm({...newProjectForm, name: e.target.value})} placeholder="e.g. Project Titan" className="w-full bg-stone-50 border-b-2 border-stone-200 focus:border-stone-800 outline-none py-3 px-2 text-xl font-bold transition-colors" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-stone-300 mb-2">Vision & Intro</label>
                            <textarea value={newProjectForm.description} onChange={(e) => setNewProjectForm({...newProjectForm, description: e.target.value})} placeholder="What problem are you solving?" className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm font-medium focus:border-stone-800 outline-none resize-none h-32 transition-colors" />
                        </div>
                        <button onClick={handleCreateProject} disabled={!newProjectForm.name.trim()} className="w-full bg-stone-900 text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-stone-200">Initialize Project</button>
                    </div>
                </div>
            </div>
        )}
        
        {/* NEW FRIENDS MODAL (No Clans) */}
        {showNetworkModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl relative flex flex-col max-h-[80vh] min-h-[500px]">
                     <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-md"><Users size={20} /></div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight text-stone-800">Find Friends</h3>
                                <p className="text-xs text-stone-400 font-mono uppercase tracking-widest">Grow your network</p>
                            </div>
                        </div>
                        <button onClick={() => setShowNetworkModal(false)} className="p-2 rounded-full bg-stone-50 text-stone-400 hover:bg-stone-100 hover:text-stone-800 transition-colors"><X size={20} /></button>
                     </div>
                     <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                        <input autoFocus value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search for founders..." className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium outline-none focus:border-stone-800 transition-colors placeholder:text-stone-300" />
                     </div>
                     <div className="overflow-y-auto pr-2 flex-1 space-y-3">
                        {allPotentialFriends.length > 0 ? (
                            allPotentialFriends.map(user => {
                                const name = 'name' in user ? user.name : user.companyName;
                                const desc = 'description' in user ? user.description : 'Building something cool';
                                const avatar = 'avatar' in user ? user.avatar : null;
                                const isMock = 'type' in user; // Mock users don't have UserProfile structure exactly
                                const status = getRelationStatus(name);

                                return (
                                    <div key={name} onClick={() => isMock ? handleVisitGroup(user as Group) : handleVisitUser(user as UserProfile)} className="p-4 rounded-2xl border border-stone-100 hover:border-stone-800 hover:bg-stone-50 transition-all cursor-pointer group flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 shadow-sm bg-stone-100 flex items-center justify-center font-bold text-stone-400">
                                            {avatar && !avatar.startsWith('#') ? <img src={avatar} className="w-full h-full object-cover" /> : name[0]}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h4 className="font-bold text-stone-800 text-sm truncate">{name}</h4>
                                                {status === 'friend' && <span className="text-[9px] font-black uppercase bg-emerald-100 text-emerald-600 px-2 py-0.5 rounded-md">Friend</span>}
                                            </div>
                                            <p className="text-xs text-stone-400 truncate">{desc}</p>
                                        </div>
                                        <button 
                                            onClick={(e) => handleFollowToggle(e, name, isMock)} 
                                            className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${
                                                status === 'friend' || status === 'requested'
                                                ? 'bg-stone-900 text-white border-stone-900' 
                                                : 'bg-white text-stone-500 border-stone-200 hover:border-stone-800 hover:text-stone-800'
                                            }`}
                                        >
                                            {status === 'friend' ? 'Connected' : (status === 'requested' ? 'Requested' : (status === 'follower' ? 'Follow Back' : 'Connect'))}
                                        </button>
                                    </div>
                                )
                            })
                        ) : (
                            <div className="py-12 text-center text-stone-300"><Users size={48} className="mx-auto mb-4 opacity-20" /><p className="text-xs font-mono uppercase tracking-widest">No users found</p></div>
                        )}
                     </div>
                </div>
            </div>
        )}

        {/* OPC LETTER MODAL (Updated Logic) */}
        {showLetterModal && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white w-full max-w-md h-[600px] rounded-[2.5rem] flex flex-col relative border border-stone-200 shadow-2xl overflow-hidden">
                    <div className="p-5 border-b border-stone-100 flex justify-between items-center bg-white z-10 shrink-0">
                        <div className="flex items-center gap-3">
                             {letterView === 'chat' && (
                                <button onClick={() => setLetterView('inbox')} className="p-2 -ml-2 rounded-full hover:bg-stone-100 transition-colors"><ArrowLeft size={16} /></button>
                             )}
                             <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm ${letterView === 'inbox' ? 'bg-stone-800' : (activeChatPartner?.isSupervisor ? 'bg-rose-500' : 'bg-blue-500')}`}>
                                {letterView === 'inbox' ? <Scroll size={20} /> : (activeChatPartner?.isSupervisor ? <Zap size={20} /> : <MessageCircle size={20} />)}
                             </div>
                             <div>
                                <h3 className={`font-black text-sm uppercase tracking-wide ${activeChatPartner?.isSupervisor ? 'text-rose-600' : 'text-stone-800'}`}>
                                    {letterView === 'inbox' ? 'OPC Mailbox' : activeChatPartner?.name}
                                </h3>
                                <p className="text-stone-400 text-[10px] font-mono">{letterView === 'inbox' ? 'Encrypted Channel' : 'Secure Connection'}</p>
                             </div>
                        </div>
                        <button onClick={() => setShowLetterModal(false)} className="text-stone-400 hover:text-stone-800 p-2"><X size={20} /></button>
                    </div>

                    {letterView === 'inbox' ? (
                        <div className="flex-1 flex flex-col overflow-hidden bg-stone-50">
                            <div className="p-4 border-b border-stone-100 bg-white">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" size={14} />
                                    <input 
                                        value={letterSearchQuery}
                                        onChange={(e) => setLetterSearchQuery(e.target.value)}
                                        placeholder="Find friend..."
                                        className="w-full bg-stone-50 border border-stone-100 rounded-xl py-3 pl-10 pr-4 text-xs font-bold outline-none focus:border-stone-300 transition-colors"
                                    />
                                </div>
                            </div>
                            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                                <div 
                                    onClick={() => openChatWith('Supervisor', true)}
                                    className="p-4 bg-white border border-rose-100 rounded-2xl shadow-sm flex items-center gap-4 cursor-pointer hover:border-rose-300 transition-all group relative"
                                >
                                    <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center text-rose-500 font-bold shrink-0 border border-rose-100"><Zap size={18} /></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-center mb-1">
                                            <h4 className="font-black text-rose-600 text-xs uppercase tracking-wider">Supervisor</h4>
                                            {hasUnreadSupervisorMsg && <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>}
                                        </div>
                                        <p className="text-[10px] text-stone-400 font-mono truncate">Official Direct Line</p>
                                    </div>
                                    <Crown size={14} className="text-rose-200 absolute top-2 right-2 rotate-12" />
                                </div>

                                {searchedFriends.length > 0 ? (
                                    searchedFriends.map(friend => (
                                        <div 
                                            key={friend.companyName}
                                            onClick={() => openChatWith(friend.companyName, false)}
                                            className="p-3 bg-white border border-stone-100 rounded-2xl shadow-sm flex items-center gap-4 cursor-pointer hover:border-blue-200 transition-all"
                                        >
                                            <div className="w-10 h-10 rounded-full bg-stone-100 overflow-hidden shrink-0 border border-stone-100">
                                                {friend.avatar ? <img src={friend.avatar} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-stone-400 font-bold">{friend.companyName[0]}</div>}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-center mb-1">
                                                    <h4 className="font-bold text-stone-800 text-xs truncate mb-0.5">{friend.companyName}</h4>
                                                    {unreadPartners.has(friend.companyName) && <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>}
                                                </div>
                                                <p className="text-[10px] text-stone-400 truncate">{friend.title || 'Founder'}</p>
                                            </div>
                                            <ArrowRight size={14} className="text-stone-300" />
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 opacity-40">
                                        <Users size={24} className="mx-auto mb-2 text-stone-400" />
                                        <p className="text-stone-400 text-[10px] uppercase tracking-widest">{letterSearchQuery ? 'No friend found' : 'Add friends to write letters'}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50 custom-scrollbar">
                                {letterMessages.length === 0 && <div className="text-center py-8 opacity-40"><Scroll size={32} className="mx-auto mb-2 text-stone-400" /><p className="text-stone-400 text-xs font-mono uppercase">Start writing...</p></div>}
                                {letterMessages.map(msg => {
                                    const isMe = msg.sender === 'user' || msg.sender === profile.companyName; 
                                    const isSupMsg = msg.sender === 'supervisor';
                                    return (
                                        <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'}`}>
                                            <div className={`max-w-[80%] p-3 rounded-2xl text-xs font-medium leading-relaxed shadow-sm ${isMe ? 'bg-stone-800 text-white rounded-br-none' : (isSupMsg ? 'bg-rose-50 border border-rose-100 text-rose-800 rounded-bl-none' : 'bg-white text-stone-800 border border-stone-200 rounded-bl-none')}`}>
                                                <p>{msg.content}</p>
                                                <span className={`block text-[8px] mt-1 text-right font-mono ${isMe ? 'opacity-50' : 'opacity-40'}`}>{new Date(msg.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
                                            </div>
                                        </div>
                                    );
                                })}
                                <div ref={chatBottomRef} />
                            </div>
                            <div className="p-4 bg-white border-t border-stone-100 shrink-0">
                                <div className="flex gap-2">
                                    <input autoFocus value={letterInput} onChange={(e) => setLetterInput(e.target.value)} placeholder={`Message ${activeChatPartner?.name}...`} className="flex-1 bg-stone-50 text-stone-800 text-xs p-3 rounded-xl outline-none focus:ring-1 focus:ring-stone-400 border border-transparent placeholder:text-stone-400 transition-all" onKeyDown={(e) => e.key === 'Enter' && handleSendLetter()} />
                                    <button onClick={handleSendLetter} disabled={!letterInput.trim()} className={`p-3 rounded-xl text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${activeChatPartner?.isSupervisor ? 'bg-rose-500 hover:bg-rose-600' : 'bg-stone-900 hover:bg-stone-800'}`}><Send size={16} /></button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        )}

        {/* INFO POPUP & LIGHTBOX */}
        {infoPopup && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-[2px] p-8" onClick={() => setInfoPopup(null)}>
                <div className="bg-white p-8 rounded-3xl max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setInfoPopup(null)} className="absolute top-6 right-6 text-stone-300 hover:text-stone-800 transition-colors"><X size={20} /></button>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <h3 className="text-xs font-black uppercase tracking-widest text-stone-400 mb-6 sticky top-0 bg-white pb-2">{infoPopup.label}</h3>
                        <p className="text-xl font-bold text-stone-800 leading-relaxed whitespace-pre-wrap break-words">{infoPopup.value}</p>
                    </div>
                </div>
            </div>
        )}
        {imagePreview && (
            <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-200" onClick={() => setImagePreview(null)}>
                <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors"><X size={32} /></button>
                <img src={imagePreview} className="max-w-full max-h-full rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
            </div>
        )}
      </div>
      <style>{`@keyframes slideDown { from { transform: translateY(-100%); } to { transform: translateY(0); } }`}</style>
    </div>
  );
};
