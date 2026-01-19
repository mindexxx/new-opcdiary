
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, Language, Project, DiaryEntry, Comment, Group, ProjectStats } from '../types';
import { TRANSLATIONS } from '../translations';
import { MOCK_GROUPS } from '../constants';
import { Plus, Image as ImageIcon, Send, Trash2, Edit2, Layout, ArrowLeft, ArrowRight, ExternalLink, Globe, Clock, DollarSign, TrendingUp, Save, X, Camera, Link as LinkIcon, Upload, Users, Search, Check, UserPlus, Info, Maximize2, MessageCircle, ChevronDown, ChevronUp, LogOut, MessageSquare, Target, Hourglass, Coins, Wallet } from 'lucide-react';
import { Roadmap } from './Roadmap';
import { Forum } from './Forum';

interface DashboardProps {
  profile: UserProfile;
  lang: Language;
  role: 'owner' | 'friend' | 'guest';
  onReset: () => void;
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

    // Matches "cost $50", "spent: 50", "paid 50", "cost 50k"
    const costRegex = /(?:cost|spend|spent|expense|paid)[\s\w:=-]*?\$?\s*(\d+(?:,\d{3})*(?:\.\d+)?)/gi;
    // Matches "profit $200", "earned 200", "made 200"
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

export const Dashboard: React.FC<DashboardProps> = ({ profile: initialProfile, lang, role, onReset }) => {
  const t = TRANSLATIONS[lang];
  const isOwner = role === 'owner';
  
  // State for current view mode
  const [viewMode, setViewMode] = useState<'home' | 'forum' | 'guest'>('home');
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

  // UI States
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editForm, setEditForm] = useState<UserProfile>(initialProfile);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newProjectForm, setNewProjectForm] = useState({ name: '', description: '' });
  
  // Social State
  const [socialTab, setSocialTab] = useState<'groups' | 'friends'>('groups');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNetworkModal, setShowNetworkModal] = useState(false);

  // Persistence for Social Actions
  const [joinedGroups, setJoinedGroups] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('opc_joined_groups') || '[]'); } catch { return []; }
  });
  const [addedFriends, setAddedFriends] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem('opc_added_friends') || '[]'); } catch { return []; }
  });

  // Popups
  const [infoPopup, setInfoPopup] = useState<{label: string, value: string} | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // Computed display profile (User's or Guest's)
  const displayProfile = viewMode === 'guest' && guestProfile ? guestProfile : profile;
  const canEdit = viewMode === 'home' && isOwner;
  
  // Computed Project Stats
  const projectTimeSpent = activeProject ? calculateTimeSpent(activeProject.entries) : '0d';

  const handlePublishDiary = async () => {
    if (!activeProject || (!diaryInput.trim() && !diaryImage)) return;
    
    setLoading(true);
    
    // Analyze content for stats
    const { cost: detectedCost, profit: detectedProfit } = analyzeEntryFinancials(diaryInput);
    
    // Simulate API call
    setTimeout(() => {
      const newEntry: DiaryEntry = {
        id: Date.now().toString(),
        content: diaryInput,
        images: diaryImage ? [diaryImage] : [],
        timestamp: Date.now(),
        date: new Date().toLocaleDateString(),
        comments: []
      };
      
      // Update Stats
      const currentCost = activeProject.stats ? parseCurrency(activeProject.stats.cost) : 0;
      const currentProfit = activeProject.stats ? parseCurrency(activeProject.stats.profit) : 0;
      
      const newStats: ProjectStats = {
          stage: activeProject.stats?.stage || 'Idea',
          timeSpent: calculateTimeSpent([...activeProject.entries, newEntry]), // Pre-calc for consistency though UI uses dynamic
          cost: formatCurrency(currentCost + detectedCost),
          profit: formatCurrency(currentProfit + detectedProfit)
      };
      
      const updated = { 
          ...activeProject, 
          entries: [newEntry, ...activeProject.entries],
          stats: newStats
      };
      
      setActiveProject(updated);
      setProjects(projects.map(p => p.id === updated.id ? updated : p));
      setDiaryInput('');
      setDiaryImage(null);
      setLoading(false);
    }, 800);
  };

  const handleCreateProject = () => {
     if(!newProjectForm.name.trim()) return;

     const newProj: Project = {
        id: Date.now().toString(),
        name: newProjectForm.name,
        description: newProjectForm.description || "A new journey begins.",
        stats: {
            stage: 'Idea',
            timeSpent: '0d',
            cost: '$0',
            profit: '$0'
        },
        entries: []
     };
     setProjects([...projects, newProj]);
     setActiveProject(newProj);
     setShowProjectModal(false);
     setNewProjectForm({ name: '', description: '' });
  };

  const handleUpdateProjectStats = (field: keyof ProjectStats, value: string) => {
      if (!activeProject) return;
      const updatedStats = { ...activeProject.stats, [field]: value } as ProjectStats;
      const updatedProject = { ...activeProject, stats: updatedStats };
      setActiveProject(updatedProject);
      setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
  };

  const toggleEditProfile = () => {
    if (isEditingProfile) {
      setProfile(editForm);
      // Persist to local storage on save
      localStorage.setItem('opc_user_profile', JSON.stringify(editForm));
    } else {
      setEditForm(profile);
    }
    setIsEditingProfile(!isEditingProfile);
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

  const handlePostComment = (entryId: string) => {
    const text = commentInputs[entryId];
    if (!text || !text.trim()) return;

    if (!activeProject) return;

    const newComment: Comment = {
      id: Date.now().toString(),
      author: profile.companyName, // Always post as self
      content: text,
      isOwner: viewMode === 'home',
      avatar: profile.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=Guest'
    };

    const updatedEntries = activeProject.entries.map(e => {
      if (e.id === entryId) {
        return { ...e, comments: [...e.comments, newComment] };
      }
      return e;
    });

    const updatedProject = { ...activeProject, entries: updatedEntries };
    setActiveProject(updatedProject);
    setProjects(projects.map(p => p.id === updatedProject.id ? updatedProject : p));
    setCommentInputs(prev => ({ ...prev, [entryId]: '' }));
    
    // Auto expand comments if posted
    setExpandedComments(prev => ({ ...prev, [entryId]: true }));
  };

  const toggleCommentExpansion = (entryId: string) => {
    setExpandedComments(prev => ({ ...prev, [entryId]: !prev[entryId] }));
  };

  const handleJoinToggle = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSet = joinedGroups.includes(id) 
        ? joinedGroups.filter(g => g !== id)
        : [...joinedGroups, id];
    setJoinedGroups(newSet);
    localStorage.setItem('opc_joined_groups', JSON.stringify(newSet));
  };

  const handleFriendToggle = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSet = addedFriends.includes(id) 
        ? addedFriends.filter(f => f !== id)
        : [...addedFriends, id];
    setAddedFriends(newSet);
    localStorage.setItem('opc_added_friends', JSON.stringify(newSet));
  };

  const filteredSocials = MOCK_GROUPS.filter(g => 
    g.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const visibleEntries = activeProject 
    ? (isDiaryExpanded ? activeProject.entries : activeProject.entries.slice(0, 5))
    : [];

  const handleVisit = (group: Group) => {
    // Simulate fetching user profile
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
    setActiveProject(null); // Reset active project so they see list first
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-4 md:p-8 pb-20">
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
           <div className="flex items-center gap-3 cursor-pointer" onClick={() => setViewMode('home')}>
             <div className="w-8 h-8 bg-stone-900 rounded-lg flex items-center justify-center shadow-lg">
               <span className="text-white font-black text-xs">OPC</span>
             </div>
             <h1 className="text-xl font-black tracking-tighter">DIARY</h1>
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

        {/* TOP NAV BAR - Social Tabs Left, Forum Button Right */}
        <div className="mb-6 flex justify-between items-center relative z-40">
            {/* Social Hub Trigger */}
            <div className="flex bg-white rounded-full border border-stone-200 p-1 shadow-sm shrink-0">
                <button 
                    onClick={() => { setSocialTab('groups'); setShowNetworkModal(true); }}
                    className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase transition-all flex items-center gap-2 ${socialTab === 'groups' && showNetworkModal ? 'bg-stone-800 text-white' : 'text-stone-400 hover:bg-stone-50 hover:text-stone-800'}`}
                >
                    Clans
                </button>
                <div className="w-px bg-stone-100 my-1 mx-1"></div>
                <button 
                    onClick={() => { setSocialTab('friends'); setShowNetworkModal(true); }}
                    className={`px-4 py-2 rounded-full text-[10px] font-bold uppercase transition-all flex items-center gap-2 ${socialTab === 'friends' && showNetworkModal ? 'bg-stone-800 text-white' : 'text-stone-400 hover:bg-stone-50 hover:text-stone-800'}`}
                >
                    Friends
                </button>
            </div>

            {/* Forum/Diary Toggle Button */}
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
        
        {/* VIEW: FORUM */}
        {viewMode === 'forum' ? (
           <Forum userProfile={profile} />
        ) : (
          /* VIEW: DIARY / PROFILE (Home or Guest) */
          <>
            {viewMode === 'guest' && (
               <div className="mb-6 flex items-center gap-2 fade-in-up">
                  <button onClick={() => setViewMode('home')} className="flex items-center gap-2 text-stone-400 hover:text-stone-800 text-xs font-bold uppercase tracking-wider bg-white px-3 py-1.5 rounded-lg border border-stone-100 shadow-sm transition-all">
                     <ArrowLeft size={12} /> Back to My Diary
                  </button>
                  <span className="text-stone-300 text-xs">|</span>
                  <span className="text-stone-400 text-xs font-mono uppercase">Viewing Guest Profile</span>
               </div>
            )}

            {/* ULTRA-COMPACT PROFILE CARD V4 (Auto-Align) */}
            <div className={`bg-white rounded-[2rem] p-5 shadow-lg shadow-stone-200/50 border border-stone-100 relative overflow-hidden mb-8 group/card fade-in-up ${viewMode === 'guest' ? 'ring-2 ring-stone-900/5' : ''}`}>
                {canEdit && (
                  <button 
                    onClick={toggleEditProfile}
                    className={`absolute top-3 right-3 z-30 p-1.5 rounded-lg transition-all shadow-sm border 
                      ${isEditingProfile 
                        ? 'bg-stone-900 text-white border-stone-900 hover:bg-black' 
                        : 'bg-white text-stone-400 border-stone-100 hover:text-stone-800 hover:border-stone-200'}
                    `}
                  >
                    {isEditingProfile ? <Save size={12} /> : <Edit2 size={12} />}
                  </button>
                )}

                <div className="flex flex-col sm:flex-row gap-5 items-stretch relative z-10">
                    
                    {/* Avatar & Basic Info */}
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

                    {/* Auto-Flowing Info Grid */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between gap-3">
                        {/* Description Row */}
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

                        {/* Stats Row - Flex to Grid auto align */}
                        <div className="grid grid-cols-3 gap-2 w-full">
                            <StatItem icon={DollarSign} label="Valuation" value={displayProfile.valuation} field="valuation" color="text-blue-500" isEditingProfile={isEditingProfile} editForm={editForm} setEditForm={setEditForm} setInfoPopup={setInfoPopup} />
                            <StatItem icon={Clock} label="Launch" value={displayProfile.devTime} field="devTime" color="text-orange-500" isEditingProfile={isEditingProfile} editForm={editForm} setEditForm={setEditForm} setInfoPopup={setInfoPopup} />
                            <StatItem icon={TrendingUp} label="Users" value={displayProfile.audience} field="audience" color="text-emerald-500" isEditingProfile={isEditingProfile} editForm={editForm} setEditForm={setEditForm} setInfoPopup={setInfoPopup} />
                        </div>
                    </div>

                    {/* Project Button */}
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

            {/* PROJECT ARCHIVE (Only show current user's projects or Guest's mocked projects) */}
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
                  {(viewMode === 'guest' ? [] : projects).map(p => (
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
                  
                  {viewMode === 'guest' && projects.length === 0 && (
                     <div className="col-span-3 py-12 text-center text-stone-300">
                         <div className="mb-2 uppercase tracking-widest text-xs">No Public Projects</div>
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
              <div className="fade-in-up">
                <button 
                  onClick={() => { setActiveProject(null); setIsDiaryExpanded(false); }}
                  className="mb-8 flex items-center gap-3 text-stone-400 hover:text-stone-800 font-black text-xs uppercase tracking-[0.3em] transition-all group"
                >
                  <div className="p-2 bg-white rounded-lg border border-stone-100 group-hover:border-stone-800 transition-colors">
                      <ArrowLeft size={16} /> 
                  </div>
                  {t.backToArchive}
                </button>

                <div className="bg-white rounded-[3rem] p-8 md:p-12 border border-stone-100 shadow-xl relative overflow-hidden">
                    <div className="flex flex-col md:flex-row justify-between items-start gap-8 mb-12">
                      <div className="flex-1">
                          <div className="flex items-center gap-4 mb-2">
                            <h3 className="text-3xl font-black uppercase tracking-tighter leading-none">{activeProject.name}</h3>
                            <div className="h-2 w-2 rounded-full bg-blue-500"></div>
                          </div>
                          <p className="text-stone-400 font-medium text-lg italic max-w-2xl leading-relaxed">
                            {activeProject.description}
                          </p>
                      </div>
                    </div>

                    {/* Diary Entry Area */}
                    {canEdit && (
                      <div className="mb-16">
                        <div className="relative group">
                            <textarea 
                              value={diaryInput}
                              onChange={(e) => setDiaryInput(e.target.value)}
                              placeholder={t.writeDiary}
                              className="w-full h-32 bg-stone-50 rounded-[2rem] p-6 outline-none focus:ring-[8px] ring-stone-100/40 transition-all font-medium text-lg border border-stone-100 shadow-inner resize-none placeholder:text-stone-300"
                            />
                            {/* Image Preview */}
                            {diaryImage && (
                                <div className="absolute bottom-20 left-6 h-12 w-12 rounded-lg overflow-hidden border-2 border-white shadow-md">
                                    <img src={diaryImage} className="w-full h-full object-cover" />
                                    <button 
                                        onClick={() => setDiaryImage(null)} 
                                        className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity"
                                    >
                                        <X size={12} className="text-white" />
                                    </button>
                                </div>
                            )}

                            <div className="absolute bottom-4 right-4 flex gap-2">
                              <input type="file" hidden ref={diaryFileRef} accept="image/*" onChange={(e) => handleImageUpload(e, 'diary')} />
                              <button 
                                onClick={() => diaryFileRef.current?.click()}
                                className={`p-3 rounded-xl shadow-sm border transition-all hover:scale-105 ${diaryImage ? 'bg-blue-50 border-blue-200 text-blue-500' : 'bg-white border-stone-100 text-stone-400 hover:text-stone-800'}`}
                              >
                                  <ImageIcon size={18} />
                              </button>
                              <button 
                                onClick={handlePublishDiary}
                                disabled={loading || (!diaryInput.trim() && !diaryImage)}
                                className="px-6 bg-stone-900 text-white rounded-xl font-black text-[10px] uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-black transition-all disabled:opacity-20 shadow-lg shadow-stone-200"
                              >
                                  {loading ? '...' : t.publish}
                                  <Send size={14} />
                              </button>
                            </div>
                        </div>
                      </div>
                    )}

                    {/* Timeline UI - WIDER AND FLATTER */}
                    <div className="w-full space-y-4">
                      <div className="flex items-center gap-6 mb-8 justify-center">
                        <div className="h-px w-12 bg-stone-200" />
                        <h4 className="text-[9px] font-black uppercase tracking-[0.5em] text-stone-300">Timeline</h4>
                        <div className="h-px w-12 bg-stone-200" />
                      </div>
                      
                      {activeProject.entries.length === 0 ? (
                        <div className="py-12 text-center">
                            <p className="text-stone-200 font-mono text-xs uppercase tracking-[0.3em] italic">Start your journey</p>
                        </div>
                      ) : (
                        <>
                          {visibleEntries.map((entry) => {
                            const visibleComments = expandedComments[entry.id] ? entry.comments : entry.comments.slice(0, 2);
                            return (
                                <div key={entry.id} className="flex gap-4 group/entry w-full">
                                    {/* Left: Date */}
                                    <div className="w-16 text-right pt-2 shrink-0">
                                        <span className="block text-xs font-black text-stone-800">{entry.date}</span>
                                        <span className="block text-[10px] font-mono text-stone-400 mt-1">
                                            {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>

                                    {/* Right: Content & Image bubble - Flat and Wide */}
                                    <div className="flex-1 bg-stone-50 rounded-xl p-4 border border-stone-100 hover:border-stone-200 hover:bg-white hover:shadow-md transition-all relative">
                                        <p className="text-sm text-stone-700 font-medium leading-relaxed whitespace-pre-wrap break-words">{entry.content}</p>
                                        
                                        {entry.images && entry.images.length > 0 && (
                                            <div className="mt-3 flex justify-start">
                                                <div 
                                                    className="w-10 h-10 rounded-lg overflow-hidden border border-stone-200 cursor-zoom-in hover:scale-105 transition-transform relative group/img shadow-sm"
                                                    onClick={() => setImagePreview(entry.images[0])}
                                                >
                                                    <img src={entry.images[0]} className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/10 group-hover/img:bg-transparent transition-colors" />
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Narrow Comment Section with Folding */}
                                        <div className="mt-4 pt-3 border-t border-stone-100">
                                            {entry.comments.length > 0 && (
                                                <div className="space-y-1 mb-2">
                                                    {visibleComments.map(c => (
                                                        <div key={c.id} className="flex gap-2">
                                                            <img src={c.avatar} className="w-4 h-4 rounded-full" />
                                                            <div className="bg-white px-2 py-0.5 rounded-r-md rounded-bl-md border border-stone-100 text-[10px] text-stone-600 break-words flex-1">
                                                                {c.content}
                                                            </div>
                                                        </div>
                                                    ))}
                                                    {entry.comments.length > 2 && (
                                                        <button 
                                                            onClick={() => toggleCommentExpansion(entry.id)}
                                                            className="text-[9px] font-bold text-stone-400 hover:text-stone-800 ml-6 flex items-center gap-1 mt-1"
                                                        >
                                                            {expandedComments[entry.id] ? "Collapse" : `View ${entry.comments.length - 2} more`}
                                                        </button>
                                                    )}
                                                </div>
                                            )}

                                            {/* Compact Input */}
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 rounded-full bg-stone-200 shrink-0 overflow-hidden">
                                                    {profile.avatar && <img src={profile.avatar} className="w-full h-full object-cover" />}
                                                </div>
                                                <div className="flex-1 relative">
                                                    <input 
                                                        value={commentInputs[entry.id] || ''}
                                                        onChange={(e) => setCommentInputs({...commentInputs, [entry.id]: e.target.value})}
                                                        placeholder={t.commentPlaceholder}
                                                        className="w-full bg-transparent text-[10px] border-b border-stone-200 focus:border-stone-400 outline-none py-1 placeholder:text-stone-300"
                                                        onKeyDown={(e) => e.key === 'Enter' && handlePostComment(entry.id)}
                                                    />
                                                    <button 
                                                        onClick={() => handlePostComment(entry.id)}
                                                        disabled={!commentInputs[entry.id]}
                                                        className="absolute right-0 top-1/2 -translate-y-1/2 text-stone-300 hover:text-blue-500 disabled:opacity-0 transition-all"
                                                    >
                                                        <Send size={10} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                          })}

                          {/* Expand/Collapse Button */}
                          {activeProject.entries.length > 5 && (
                            <div className="flex justify-center pt-4">
                                <button 
                                    onClick={() => setIsDiaryExpanded(!isDiaryExpanded)}
                                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-stone-200 text-[10px] font-bold uppercase tracking-widest text-stone-500 hover:text-stone-800 hover:border-stone-400 transition-all shadow-sm"
                                >
                                    {isDiaryExpanded ? (
                                        <>Collapse <ChevronUp size={12} /></>
                                    ) : (
                                        <>Expand History ({activeProject.entries.length - 5} More) <ChevronDown size={12} /></>
                                    )}
                                </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Roadmap */}
                    <div className="mt-16 pt-8 border-t border-stone-50">
                      <h4 className="text-[9px] font-black uppercase tracking-[0.5em] text-stone-300 mb-6 text-center">Roadmap</h4>
                      
                      {/* Project Stats (4 Square Windows) */}
                      {activeProject.stats && (
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                             <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex flex-col items-center justify-center gap-2 group hover:border-blue-200 transition-colors">
                                 <div className="flex items-center gap-2 text-stone-400">
                                     <Target size={14} />
                                     <span className="text-[9px] font-black uppercase tracking-widest">{t.stage || 'Stage'}</span>
                                 </div>
                                 {canEdit ? (
                                     <input 
                                        className="text-center font-black text-lg text-stone-800 w-full outline-none bg-transparent placeholder:text-stone-200"
                                        placeholder="Idea"
                                        value={activeProject.stats.stage}
                                        onChange={(e) => handleUpdateProjectStats('stage', e.target.value)}
                                     />
                                 ) : (
                                     <span className="font-black text-lg text-stone-800">{activeProject.stats.stage}</span>
                                 )}
                             </div>
                             <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex flex-col items-center justify-center gap-2 group hover:border-orange-200 transition-colors">
                                 <div className="flex items-center gap-2 text-stone-400">
                                     <Hourglass size={14} />
                                     <span className="text-[9px] font-black uppercase tracking-widest">{t.timeSpent || 'Time'}</span>
                                 </div>
                                 <span className="font-black text-lg text-stone-800">{projectTimeSpent}</span>
                             </div>
                             <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex flex-col items-center justify-center gap-2 group hover:border-rose-200 transition-colors">
                                 <div className="flex items-center gap-2 text-stone-400">
                                     <Coins size={14} />
                                     <span className="text-[9px] font-black uppercase tracking-widest">{t.cost || 'Cost'}</span>
                                 </div>
                                 {canEdit ? (
                                     <input 
                                        className="text-center font-black text-lg text-stone-800 w-full outline-none bg-transparent placeholder:text-stone-200"
                                        placeholder="$0"
                                        value={activeProject.stats.cost}
                                        onChange={(e) => handleUpdateProjectStats('cost', e.target.value)}
                                     />
                                 ) : (
                                     <span className="font-black text-lg text-stone-800">{activeProject.stats.cost}</span>
                                 )}
                             </div>
                             <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex flex-col items-center justify-center gap-2 group hover:border-emerald-200 transition-colors">
                                 <div className="flex items-center gap-2 text-stone-400">
                                     <Wallet size={14} />
                                     <span className="text-[9px] font-black uppercase tracking-widest">{t.profit || 'Profit'}</span>
                                 </div>
                                 {canEdit ? (
                                     <input 
                                        className="text-center font-black text-lg text-stone-800 w-full outline-none bg-transparent placeholder:text-stone-200"
                                        placeholder="$0"
                                        value={activeProject.stats.profit}
                                        onChange={(e) => handleUpdateProjectStats('profit', e.target.value)}
                                     />
                                 ) : (
                                     <span className="font-black text-lg text-stone-800">{activeProject.stats.profit}</span>
                                 )}
                             </div>
                          </div>
                      )}

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

        {/* CREATE PROJECT MODAL */}
        {showProjectModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                <div className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl relative">
                    <button 
                        onClick={() => setShowProjectModal(false)}
                        className="absolute top-6 right-6 p-2 rounded-full bg-stone-50 text-stone-400 hover:bg-stone-100 hover:text-stone-800 transition-colors"
                    >
                        <X size={20} />
                    </button>
                    
                    <div className="mb-8">
                        <div className="w-12 h-12 rounded-xl bg-stone-900 text-white flex items-center justify-center mb-4 shadow-lg">
                            <Plus size={24} />
                        </div>
                        <h2 className="text-2xl font-black uppercase tracking-tight text-stone-800">Ignite New Project</h2>
                        <p className="text-stone-400 font-medium italic mt-2">Define the legacy you want to build.</p>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-stone-300 mb-2">Project Name</label>
                            <input 
                                autoFocus
                                value={newProjectForm.name}
                                onChange={(e) => setNewProjectForm({...newProjectForm, name: e.target.value})}
                                placeholder="e.g. Project Titan"
                                className="w-full bg-stone-50 border-b-2 border-stone-200 focus:border-stone-800 outline-none py-3 px-2 text-xl font-bold transition-colors"
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-stone-300 mb-2">Vision & Intro</label>
                            <textarea 
                                value={newProjectForm.description}
                                onChange={(e) => setNewProjectForm({...newProjectForm, description: e.target.value})}
                                placeholder="What problem are you solving?"
                                className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm font-medium focus:border-stone-800 outline-none resize-none h-32 transition-colors"
                            />
                        </div>
                        <button 
                            onClick={handleCreateProject}
                            disabled={!newProjectForm.name.trim()}
                            className="w-full bg-stone-900 text-white py-4 rounded-xl font-black uppercase tracking-[0.2em] hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xl shadow-stone-200"
                        >
                            Initialize Project
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* SOCIAL NETWORK MODAL (Centralized, Independent Window) */}
        {showNetworkModal && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/60 backdrop-blur-sm p-4 animate-in fade-in zoom-in-95 duration-200">
                <div className="bg-white rounded-[2.5rem] p-8 max-w-lg w-full shadow-2xl relative flex flex-col max-h-[80vh] min-h-[500px]">
                     <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-stone-900 text-white flex items-center justify-center shadow-md">
                                <Users size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black uppercase tracking-tight text-stone-800">
                                    {socialTab === 'groups' ? 'Your Clans' : 'Your Friends'}
                                </h3>
                                <p className="text-xs text-stone-400 font-mono uppercase tracking-widest">Manage your network</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => setShowNetworkModal(false)}
                            className="p-2 rounded-full bg-stone-50 text-stone-400 hover:bg-stone-100 hover:text-stone-800 transition-colors"
                        >
                            <X size={20} />
                        </button>
                     </div>

                     {/* Search in Modal */}
                     <div className="relative mb-6">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                        <input 
                            autoFocus
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder={t.searchPlaceholder}
                            className="w-full bg-stone-50 border border-stone-100 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium outline-none focus:border-stone-800 transition-colors placeholder:text-stone-300"
                        />
                     </div>

                     {/* List in Modal */}
                     <div className="overflow-y-auto pr-2 flex-1 space-y-3">
                        {filteredSocials.filter(g => (socialTab === 'groups' ? g.type === 'group' : g.type === 'user')).map(item => (
                            <div 
                                key={item.id} 
                                onClick={() => handleVisit(item)}
                                className="p-4 rounded-2xl border border-stone-100 hover:border-stone-800 hover:bg-stone-50 transition-all cursor-pointer group flex items-center gap-4"
                            >
                                <div className="w-12 h-12 rounded-full overflow-hidden shrink-0 shadow-sm" style={{ backgroundColor: item.avatar.startsWith('#') ? item.avatar : undefined }}>
                                    {!item.avatar.startsWith('#') && <img src={item.avatar} className="w-full h-full object-cover" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <h4 className="font-bold text-stone-800 text-sm truncate">{item.name}</h4>
                                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${item.type === 'group' ? 'bg-blue-50 text-blue-500' : 'bg-emerald-50 text-emerald-500'}`}>
                                            {item.type === 'group' ? (lang === 'en' ? 'Clan' : '圈子') : (lang === 'en' ? 'User' : '用户')}
                                        </span>
                                    </div>
                                    <p className="text-xs text-stone-400 truncate">{item.description}</p>
                                </div>
                                {item.type === 'group' ? (
                                    <button 
                                        onClick={(e) => handleJoinToggle(e, item.id)}
                                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${
                                            joinedGroups.includes(item.id) 
                                            ? 'bg-stone-900 text-white border-stone-900' 
                                            : 'bg-white text-stone-500 border-stone-200 hover:border-stone-800 hover:text-stone-800'
                                        }`}
                                    >
                                        {joinedGroups.includes(item.id) ? (lang === 'en' ? 'Joined' : '已加入') : t.join}
                                    </button>
                                ) : (
                                    <button 
                                        onClick={(e) => handleFriendToggle(e, item.id)}
                                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-wider border transition-all ${
                                            addedFriends.includes(item.id) 
                                            ? 'bg-stone-900 text-white border-stone-900' 
                                            : 'bg-white text-stone-500 border-stone-200 hover:border-stone-800 hover:text-stone-800'
                                        }`}
                                    >
                                         {addedFriends.includes(item.id) ? t.added : t.add}
                                    </button>
                                )}
                            </div>
                        ))}
                        {filteredSocials.filter(g => (socialTab === 'groups' ? g.type === 'group' : g.type === 'user')).length === 0 && (
                            <div className="py-12 text-center text-stone-300">
                                <Users size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="text-xs font-mono uppercase tracking-widest">No connections found</p>
                            </div>
                        )}
                     </div>
                </div>
            </div>
        )}

        {/* INFO POPUP MODAL (Fixed Text Overflow) */}
        {infoPopup && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/20 backdrop-blur-[2px] p-8" onClick={() => setInfoPopup(null)}>
                <div className="bg-white p-8 rounded-3xl max-w-lg w-full shadow-2xl animate-in zoom-in-95 duration-200 relative overflow-hidden flex flex-col max-h-[80vh]" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => setInfoPopup(null)} className="absolute top-6 right-6 text-stone-300 hover:text-stone-800 transition-colors">
                        <X size={20} />
                    </button>
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <h3 className="text-xs font-black uppercase tracking-widest text-stone-400 mb-6 sticky top-0 bg-white pb-2">{infoPopup.label}</h3>
                        <p className="text-xl font-bold text-stone-800 leading-relaxed whitespace-pre-wrap break-words">
                            {infoPopup.value}
                        </p>
                    </div>
                </div>
            </div>
        )}

        {/* IMAGE LIGHTBOX */}
        {imagePreview && (
            <div className="fixed inset-0 z-[70] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-200" onClick={() => setImagePreview(null)}>
                <button className="absolute top-6 right-6 text-white/50 hover:text-white transition-colors">
                    <X size={32} />
                </button>
                <img src={imagePreview} className="max-w-full max-h-full rounded-lg shadow-2xl" onClick={(e) => e.stopPropagation()} />
            </div>
        )}
      </div>
    </div>
  );
};
