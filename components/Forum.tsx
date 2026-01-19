
import React, { useState, useEffect } from 'react';
import { ForumPost, UserProfile, ForumComment } from '../types';
import { MOCK_FORUM_POSTS } from '../constants';
import { MessageSquare, Heart, Send, Plus, Search, CornerDownRight, Image as ImageIcon, Link as LinkIcon, ChevronDown, ChevronUp, X, ExternalLink, Edit2, Trash2, Save, Cpu, Zap, Wind, Truck, BarChart3, Grip, ArrowUpRight } from 'lucide-react';

interface ForumProps {
  userProfile: UserProfile;
  onImageClick?: (url: string) => void;
}

const CATEGORIES = [
    { id: 'HOLON', label: 'HOLON', icon: Cpu, color: 'text-purple-500', bg: 'bg-purple-50', border: 'border-purple-200' },
    { id: 'AC&CCHP', label: 'AC & CCHP', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50', border: 'border-amber-200' },
    { id: 'WIND POWER', label: 'WIND POWER', icon: Wind, color: 'text-sky-500', bg: 'bg-sky-50', border: 'border-sky-200' },
    { id: 'ROAD&BRIDGE', label: 'ROAD & BRIDGE', icon: Truck, color: 'text-stone-600', bg: 'bg-stone-100', border: 'border-stone-300' },
    { id: 'ENERGY MANAGEMENT', label: 'ENERGY MGT', icon: BarChart3, color: 'text-emerald-500', bg: 'bg-emerald-50', border: 'border-emerald-200' },
];

export const Forum: React.FC<ForumProps> = ({ userProfile, onImageClick }) => {
  const [posts, setPosts] = useState<ForumPost[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('HOLON'); // Default category

  // Create Post State
  const [newPostContent, setNewPostContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [postImage, setPostImage] = useState<string | null>(null);
  const [postLink, setPostLink] = useState<string>('');
  const [showMediaOptions, setShowMediaOptions] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  
  // UI State
  const [isMyPostsOpen, setIsMyPostsOpen] = useState(false);
  
  // State for interactive elements
  const [expandedComments, setExpandedComments] = useState<Record<string, boolean>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Editing State
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');

  // Load posts on mount
  useEffect(() => {
      try {
          const stored = JSON.parse(localStorage.getItem('opc_forum_posts') || 'null');
          if (stored) {
              setPosts(stored);
          } else {
              setPosts(MOCK_FORUM_POSTS); // Fallback to mocks only if empty
          }
      } catch {
          setPosts(MOCK_FORUM_POSTS);
      }
  }, []);

  const savePosts = (newPosts: ForumPost[]) => {
      setPosts(newPosts);
      localStorage.setItem('opc_forum_posts', JSON.stringify(newPosts));
  };

  const handleCreatePost = () => {
    if (!newPostContent.trim() && !postImage && !postLink) return;

    const newPost: ForumPost = {
      id: Date.now().toString(),
      author: {
        name: userProfile.companyName,
        avatar: userProfile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile.companyName}`,
        title: userProfile.title || 'Solo Founder'
      },
      content: newPostContent,
      image: postImage,
      link: postLink || null,
      category: activeCategory, // Tag with current category
      timestamp: Date.now(),
      likes: 0,
      likedBy: [],
      comments: 0,
      commentsList: [],
      tags: [activeCategory]
    };

    savePosts([newPost, ...posts]);
    setNewPostContent('');
    setPostImage(null);
    setPostLink('');
    setShowLinkInput(false);
    setShowMediaOptions(false);
  };

  const handleLike = (postId: string) => {
    const userName = userProfile.companyName;
    const updated = posts.map(post => {
      if (post.id === postId) {
        // Fallback for posts created before schema update
        const likedBy = post.likedBy || [];
        const isLiked = likedBy.includes(userName);
        
        // Toggle logic: If liked, remove user. If not liked, add user.
        const newLikedBy = isLiked 
            ? likedBy.filter(name => name !== userName) 
            : [...likedBy, userName];

        return {
          ...post,
          likedBy: newLikedBy,
          likes: newLikedBy.length
        };
      }
      return post;
    });
    savePosts(updated);
  };

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const handlePostComment = (postId: string) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;

    const newComment: ForumComment = {
      id: Date.now().toString(),
      author: {
        name: userProfile.companyName,
        avatar: userProfile.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userProfile.companyName}`
      },
      content: text,
      timestamp: Date.now()
    };

    const updated = posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          commentsList: [...(post.commentsList || []), newComment],
          comments: (post.comments || 0) + 1
        };
      }
      return post;
    });

    savePosts(updated);
    setCommentInputs(prev => ({ ...prev, [postId]: '' }));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPostImage(reader.result as string);
        setShowMediaOptions(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const startEdit = (e: React.MouseEvent, post: ForumPost) => {
      e.stopPropagation();
      setEditingPostId(post.id);
      setEditContent(post.content);
  };

  const cancelEdit = () => {
      setEditingPostId(null);
      setEditContent('');
  };

  const saveEdit = (postId: string) => {
      const updated = posts.map(p => {
          if (p.id === postId) {
              return { ...p, content: editContent };
          }
          return p;
      });
      savePosts(updated);
      setEditingPostId(null);
      setEditContent('');
  };

  const deletePost = (e: React.MouseEvent, postId: string) => {
      e.stopPropagation();
      if (window.confirm("Are you sure you want to delete this post?")) {
          const updated = posts.filter(p => p.id !== postId);
          savePosts(updated);
      }
  };

  // Filter logic: Match Search Query AND Active Category
  const filteredPosts = posts.filter(post => {
      // 1. Category Match (Legacy posts without category default to HOLON or just show in first tab for now, let's say HOLON is default)
      const postCategory = post.category || 'HOLON'; 
      const categoryMatch = postCategory === activeCategory;

      // 2. Search Match
      const searchMatch = 
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

      return categoryMatch && searchMatch;
  });

  const myPosts = posts.filter(post => post.author.name === userProfile.companyName);
  
  // Get active category details for styling
  const currentCatStyle = CATEGORIES.find(c => c.id === activeCategory) || CATEGORIES[0];

  return (
    <div className="w-full max-w-5xl mx-auto fade-in-up pb-20">
      
      {/* CATEGORY HEADER (FORUM SECTIONS) */}
      <div className="mb-8 overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex gap-4 min-w-max">
              {CATEGORIES.map(cat => {
                  const isActive = activeCategory === cat.id;
                  const Icon = cat.icon;
                  return (
                      <button
                        key={cat.id}
                        onClick={() => setActiveCategory(cat.id)}
                        className={`
                            relative flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all w-32 h-24 group
                            ${isActive ? `${cat.bg} ${cat.border} shadow-sm` : 'bg-white border-stone-100 hover:border-stone-200'}
                        `}
                      >
                          <div className={`mb-2 ${isActive ? cat.color : 'text-stone-300 group-hover:text-stone-400'}`}>
                              <Icon size={24} />
                          </div>
                          <span className={`text-[10px] font-black uppercase text-center leading-tight ${isActive ? 'text-stone-800' : 'text-stone-400'}`}>
                              {cat.label}
                          </span>
                          {isActive && (
                              <div className={`absolute -bottom-3 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full ${cat.color.replace('text', 'bg')}`} />
                          )}
                      </button>
                  );
              })}
          </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-8 items-start">
        
        {/* LEFT COLUMN: CREATE POST & FEED */}
        <div className="flex-1 w-full">
            
            {/* Create Post Area */}
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-stone-100 mb-8 relative">
                <div className="flex justify-between items-center mb-4">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md ${currentCatStyle.bg} ${currentCatStyle.color}`}>
                        Posting to: {currentCatStyle.label}
                    </span>
                </div>
                <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full overflow-hidden border border-stone-100 shrink-0">
                    {userProfile.avatar ? (
                        <img src={userProfile.avatar} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full bg-stone-200" />
                    )}
                </div>
                <div className="flex-1">
                    <textarea 
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        placeholder={`Share something about ${currentCatStyle.label}...`}
                        className="w-full bg-stone-50 rounded-xl p-4 min-h-[100px] outline-none border border-transparent focus:border-stone-200 transition-all resize-none text-sm font-medium placeholder:text-stone-300"
                    />
                    
                    {/* Media Previews */}
                    {(postImage || postLink) && (
                        <div className="mt-3 flex flex-col gap-2">
                            {postImage && (
                                <div className="relative w-fit">
                                    <img src={postImage} className="h-20 w-auto rounded-lg border border-stone-200" />
                                    <button onClick={() => setPostImage(null)} className="absolute -top-2 -right-2 bg-stone-900 text-white rounded-full p-1"><X size={10} /></button>
                                </div>
                            )}
                            {postLink && (
                                <div className="flex items-center gap-2 text-blue-500 bg-blue-50 px-3 py-2 rounded-lg text-xs w-fit">
                                    <LinkIcon size={12} />
                                    <span className="truncate max-w-[200px]">{postLink}</span>
                                    <button onClick={() => setPostLink('')} className="ml-2 text-stone-400 hover:text-stone-800"><X size={12} /></button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Link Input */}
                    {showLinkInput && (
                        <div className="mt-3 flex gap-2 animate-in fade-in slide-in-from-top-1">
                            <input 
                                autoFocus
                                value={postLink}
                                onChange={(e) => setPostLink(e.target.value)}
                                placeholder="https://..."
                                className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-stone-800"
                            />
                            <button onClick={() => setShowLinkInput(false)} className="bg-stone-100 text-stone-500 px-3 py-2 rounded-lg text-xs font-bold">Cancel</button>
                        </div>
                    )}

                    <div className="flex justify-between items-center mt-4">
                        <div className="flex gap-2">
                            <button 
                                onClick={() => setShowMediaOptions(!showMediaOptions)}
                                className={`p-2 rounded-full transition-colors ${showMediaOptions ? 'bg-stone-100 text-stone-800' : 'text-stone-400 hover:bg-stone-50 hover:text-stone-600'}`}
                            >
                                <Plus size={20} />
                            </button>
                            {showMediaOptions && (
                                <div className="flex gap-2 animate-in fade-in slide-in-from-left-2">
                                    <label className="p-2 rounded-full text-stone-500 hover:bg-stone-100 cursor-pointer transition-colors" title="Add Image">
                                        <ImageIcon size={20} />
                                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                                    </label>
                                    <button onClick={() => setShowLinkInput(true)} className="p-2 rounded-full text-stone-500 hover:bg-stone-100 transition-colors" title="Add Link">
                                        <LinkIcon size={20} />
                                    </button>
                                </div>
                            )}
                        </div>
                        <button 
                            onClick={handleCreatePost}
                            disabled={!newPostContent.trim() && !postImage}
                            className="bg-stone-900 text-white px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
                        >
                            Post to {activeCategory}
                        </button>
                    </div>
                </div>
                </div>
            </div>

            {/* Feed Controls */}
            <div className="flex justify-between items-center px-2 mb-6">
                 <div className="flex items-center gap-2">
                     <div className={`p-1.5 rounded-lg ${currentCatStyle.bg} ${currentCatStyle.color}`}>
                         {React.createElement(currentCatStyle.icon, { size: 14 })}
                     </div>
                     <h3 className="text-xs font-black uppercase tracking-widest text-stone-800">{activeCategory} Feed</h3>
                 </div>
                 <button 
                    onClick={() => setIsMyPostsOpen(!isMyPostsOpen)}
                    className="text-[10px] font-bold uppercase tracking-widest text-stone-400 hover:text-stone-800 flex items-center gap-1"
                >
                    {isMyPostsOpen ? 'View All' : 'My Posts Only'}
                </button>
            </div>

            {/* Posts List */}
            <div className="space-y-6">
                {(isMyPostsOpen ? myPosts : filteredPosts).map(post => {
                    const isLiked = post.likedBy?.includes(userProfile.companyName) ?? false;
                    const isAuthor = post.author.name === userProfile.companyName;
                    const isEditing = editingPostId === post.id;
                    
                    return (
                    <div key={post.id} className="bg-white p-6 rounded-[2rem] border border-stone-100 shadow-sm hover:shadow-md transition-shadow group">
                        {/* Post Header */}
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full overflow-hidden border border-stone-100">
                                    <img src={post.author.avatar} className="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-stone-800 leading-none">{post.author.name}</h4>
                                    <p className="text-[10px] text-stone-400 font-mono mt-1">{post.author.title}</p>
                                </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                                <span className="text-[10px] font-mono text-stone-300">
                                    {new Date(post.timestamp).toLocaleDateString()}
                                </span>
                                {isAuthor && !isEditing && (
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button onClick={(e) => startEdit(e, post)} className="text-stone-300 hover:text-blue-500 p-2"><Edit2 size={14} /></button>
                                        <button onClick={(e) => deletePost(e, post.id)} className="text-stone-300 hover:text-rose-500 p-2"><Trash2 size={14} /></button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Content */}
                        <div className="mb-4">
                            {isEditing ? (
                                <div className="mb-4">
                                    <textarea 
                                        value={editContent}
                                        onChange={(e) => setEditContent(e.target.value)}
                                        className="w-full bg-stone-50 rounded-xl p-3 text-sm border border-stone-200 outline-none focus:border-stone-400 min-h-[100px]"
                                    />
                                    <div className="flex justify-end gap-2 mt-2">
                                        <button onClick={cancelEdit} className="text-xs font-bold text-stone-400 hover:text-stone-600 px-3 py-1">Cancel</button>
                                        <button onClick={() => saveEdit(post.id)} className="bg-stone-900 text-white px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1 hover:bg-black"><Save size={12} /> Save</button>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-stone-700 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
                            )}
                            
                            {post.image && (
                                <div 
                                    className="mt-3 rounded-xl overflow-hidden border border-stone-100 max-h-64 w-full cursor-zoom-in hover:opacity-95 transition-opacity"
                                    onClick={() => onImageClick?.(post.image!)}
                                >
                                    <img src={post.image} className="w-full h-full object-cover" />
                                </div>
                            )}
                            {post.link && (
                                <a href={post.link} target="_blank" rel="noopener noreferrer" className="mt-3 flex items-center gap-2 bg-stone-50 p-3 rounded-xl border border-stone-100 hover:bg-stone-100 transition-colors group/link">
                                    <div className="bg-white p-2 rounded-lg border border-stone-100 text-blue-500">
                                        <LinkIcon size={16} />
                                    </div>
                                    <span className="text-xs text-stone-500 truncate flex-1 font-medium">{post.link}</span>
                                    <ExternalLink size={12} className="text-stone-300 group-hover/link:text-stone-500" />
                                </a>
                            )}
                        </div>

                        {/* Tags */}
                        <div className="flex gap-2 mb-4 flex-wrap">
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-md border ${currentCatStyle.bg} ${currentCatStyle.color} ${currentCatStyle.border}`}>
                                {post.category || 'HOLON'}
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-6 border-t border-stone-50 pt-4">
                            <button 
                                onClick={() => handleLike(post.id)}
                                className={`flex items-center gap-2 text-xs font-bold transition-colors ${isLiked ? 'text-rose-500' : 'text-stone-400 hover:text-stone-600'}`}
                            >
                                <Heart size={16} className={isLiked ? 'fill-rose-500' : ''} />
                                {post.likes}
                            </button>
                            <button 
                                onClick={() => toggleComments(post.id)}
                                className={`flex items-center gap-2 text-xs font-bold transition-colors ${expandedComments[post.id] ? 'text-blue-500' : 'text-stone-400 hover:text-stone-600'}`}
                            >
                                <MessageSquare size={16} />
                                {post.comments}
                            </button>
                        </div>

                        {/* Comments Section */}
                        {expandedComments[post.id] && (
                            <div className="mt-4 pt-4 border-t border-stone-50 animate-in fade-in slide-in-from-top-2">
                                <div className="space-y-3 mb-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                    {post.commentsList?.map(comment => (
                                        <div key={comment.id} className="flex gap-3 items-start">
                                            <img src={comment.author.avatar} className="w-6 h-6 rounded-full mt-1" />
                                            <div className="bg-stone-50 rounded-2xl rounded-tl-none p-3 flex-1">
                                                <div className="flex justify-between items-baseline mb-1">
                                                    <span className="text-xs font-bold text-stone-700">{comment.author.name}</span>
                                                    <span className="text-[8px] text-stone-300 font-mono">{new Date(comment.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                </div>
                                                <p className="text-xs text-stone-600 leading-relaxed">{comment.content}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {(!post.commentsList || post.commentsList.length === 0) && (
                                        <p className="text-center text-[10px] text-stone-300 italic py-2">No comments yet. Be the first!</p>
                                    )}
                                </div>
                                
                                <div className="flex gap-2 items-center">
                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-stone-100 shrink-0">
                                        {userProfile.avatar && <img src={userProfile.avatar} className="w-full h-full object-cover" />}
                                    </div>
                                    <div className="flex-1 relative">
                                        <input 
                                            value={commentInputs[post.id] || ''}
                                            onChange={(e) => setCommentInputs({...commentInputs, [post.id]: e.target.value})}
                                            placeholder="Write a reply..."
                                            className="w-full bg-stone-50 rounded-xl py-2 pl-3 pr-10 text-xs font-medium outline-none border border-transparent focus:border-stone-200 transition-colors"
                                            onKeyDown={(e) => e.key === 'Enter' && handlePostComment(post.id)}
                                        />
                                        <button 
                                            onClick={() => handlePostComment(post.id)}
                                            disabled={!commentInputs[post.id]}
                                            className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-blue-500 disabled:opacity-0 transition-opacity"
                                        >
                                            <Send size={14} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    )
                })}

                {filteredPosts.length === 0 && (
                    <div className="text-center py-16 opacity-50">
                        <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center ${currentCatStyle.bg}`}>
                             {React.createElement(currentCatStyle.icon, { size: 32, className: currentCatStyle.color })}
                        </div>
                        <p className="text-stone-400 font-mono text-xs uppercase tracking-widest">No discussions in {activeCategory} yet</p>
                    </div>
                )}
            </div>
        </div>

        {/* RIGHT COLUMN: SEARCH & INFO */}
        <div className="w-full lg:w-72 shrink-0">
             {/* Search */}
             <div className="bg-white rounded-[2rem] p-1 border border-stone-100 shadow-sm mb-6">
                <div className="relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
                    <input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search posts..."
                        className="w-full bg-transparent rounded-2xl py-3 pl-12 pr-4 text-xs font-bold outline-none text-stone-700 placeholder:text-stone-300"
                    />
                </div>
            </div>

            {/* Category Info Card */}
            <div className={`rounded-[2rem] p-6 border ${currentCatStyle.bg} ${currentCatStyle.border}`}>
                <div className={`w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-4 shadow-sm ${currentCatStyle.color}`}>
                    {React.createElement(currentCatStyle.icon, { size: 24 })}
                </div>
                <h3 className={`text-lg font-black uppercase leading-none mb-2 ${currentCatStyle.color.replace('text', 'text-stone')}`}>
                    {currentCatStyle.label}
                </h3>
                <p className="text-xs text-stone-500 font-medium leading-relaxed mb-6">
                    Connect with experts and builders focused on {currentCatStyle.label.toLowerCase()} technologies and solutions.
                </p>
                <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-stone-400">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                    {filteredPosts.length} Active Posts
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};
