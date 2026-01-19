
import React, { useState } from 'react';
import { ForumPost, UserProfile, ForumComment } from '../types';
import { MOCK_FORUM_POSTS } from '../constants';
import { MessageSquare, Heart, Send, Plus, Search, CornerDownRight, Image as ImageIcon, Link as LinkIcon, ChevronDown, ChevronUp, X, ExternalLink } from 'lucide-react';

interface ForumProps {
  userProfile: UserProfile;
}

export const Forum: React.FC<ForumProps> = ({ userProfile }) => {
  const [posts, setPosts] = useState<ForumPost[]>(MOCK_FORUM_POSTS);
  const [newPostContent, setNewPostContent] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  
  // New Post Media State
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
      timestamp: Date.now(),
      likes: 0,
      likedByMe: false,
      comments: 0,
      commentsList: [],
      tags: ['Discussion']
    };

    setPosts([newPost, ...posts]);
    setNewPostContent('');
    setPostImage(null);
    setPostLink('');
    setShowLinkInput(false);
    setShowMediaOptions(false);
  };

  const handleLike = (postId: string) => {
    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          likedByMe: !post.likedByMe,
          likes: post.likedByMe ? post.likes - 1 : post.likes + 1
        };
      }
      return post;
    }));
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

    setPosts(posts.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          commentsList: [...(post.commentsList || []), newComment],
          comments: (post.comments || 0) + 1
        };
      }
      return post;
    }));

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

  // Filter posts based on search query
  const filteredPosts = posts.filter(post => 
    post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.author.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const myPosts = posts.filter(post => post.author.name === userProfile.companyName);

  return (
    <div className="w-full max-w-3xl mx-auto fade-in-up pb-20">
      
      {/* Search Bar */}
      <div className="mb-8 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" size={16} />
          <input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search discussions, tags, or users..."
            className="w-full bg-white border border-stone-200 rounded-2xl py-3 pl-12 pr-4 text-sm font-medium outline-none focus:border-stone-800 transition-colors shadow-sm placeholder:text-stone-300"
          />
      </div>

      {/* Create Post Area */}
      <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-stone-100 mb-6 relative">
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
                placeholder="Share your journey, ask a question, or vent..."
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
                        className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-stone-400"
                        onKeyDown={(e) => e.key === 'Enter' && setShowLinkInput(false)}
                      />
                      <button onClick={() => setShowLinkInput(false)} className="bg-stone-200 px-3 rounded-lg text-xs font-bold text-stone-600">Add</button>
                  </div>
              )}

              <div className="flex justify-between items-center mt-4">
                 <div className="flex gap-2 relative">
                    <button 
                        onClick={() => setShowMediaOptions(!showMediaOptions)}
                        className={`p-2 rounded-full transition-colors ${showMediaOptions ? 'bg-stone-100 text-stone-800' : 'text-stone-300 hover:bg-stone-50 hover:text-stone-500'}`}
                    >
                        <Plus size={18} />
                    </button>
                    
                    {/* Floating Upload Menu */}
                    {showMediaOptions && (
                        <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-xl border border-stone-100 p-2 flex flex-col gap-1 z-20 min-w-[120px] animate-in fade-in zoom-in-95 duration-200">
                             <label className="flex items-center gap-3 px-3 py-2 hover:bg-stone-50 rounded-lg cursor-pointer text-xs font-bold text-stone-600">
                                 <ImageIcon size={14} /> Image
                                 <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleImageUpload} />
                             </label>
                             <button 
                                onClick={() => { setShowLinkInput(true); setShowMediaOptions(false); }}
                                className="flex items-center gap-3 px-3 py-2 hover:bg-stone-50 rounded-lg cursor-pointer text-xs font-bold text-stone-600 text-left"
                             >
                                 <LinkIcon size={14} /> Link
                             </button>
                        </div>
                    )}
                 </div>
                 <button 
                  onClick={handleCreatePost}
                  disabled={!newPostContent.trim() && !postImage && !postLink}
                  className="bg-stone-900 text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all disabled:opacity-50 flex items-center gap-2"
                 >
                   Post <Send size={12} />
                 </button>
              </div>
           </div>
        </div>
      </div>

      {/* My Posts Folding Section */}
      <div className="mb-8">
          <button 
            onClick={() => setIsMyPostsOpen(!isMyPostsOpen)}
            className="flex items-center justify-between w-full bg-white px-6 py-4 rounded-[2rem] shadow-sm border border-stone-100 hover:border-stone-300 transition-all group"
          >
              <div className="flex items-center gap-3">
                  <div className="bg-stone-100 p-2 rounded-full text-stone-500 group-hover:text-stone-800 transition-colors">
                      {isMyPostsOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </div>
                  <span className="font-black text-xs uppercase tracking-widest text-stone-500 group-hover:text-stone-800">My Posts ({myPosts.length})</span>
              </div>
          </button>
          
          {isMyPostsOpen && (
              <div className="mt-4 space-y-4 pl-4 border-l-2 border-stone-100 animate-in fade-in slide-in-from-top-2">
                  {myPosts.length > 0 ? myPosts.map(post => (
                      <div key={post.id} className="bg-white p-4 rounded-2xl border border-stone-100 flex justify-between items-center opacity-75 hover:opacity-100 transition-opacity cursor-pointer">
                          <p className="text-xs font-medium text-stone-600 truncate flex-1 pr-4">{post.content}</p>
                          <div className="flex items-center gap-3 text-[10px] text-stone-400 font-mono">
                              <span>{new Date(post.timestamp).toLocaleDateString()}</span>
                              <span className="flex items-center gap-1"><Heart size={10} /> {post.likes}</span>
                          </div>
                      </div>
                  )) : (
                      <div className="p-4 text-center text-xs text-stone-300 font-mono">You haven't posted anything yet.</div>
                  )}
              </div>
          )}
      </div>

      {/* Main Feed */}
      <div className="space-y-6">
        <h3 className="text-[10px] font-black uppercase tracking-widest text-stone-400 pl-4 mb-4">Latest Discussions</h3>
        {filteredPosts.map(post => {
            const isCommentsOpen = expandedComments[post.id];
            
            return (
              <div key={post.id} className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-stone-100 hover:shadow-md transition-all">
                {/* Header */}
                <div className="flex items-center gap-4 mb-4">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-stone-100">
                      <img src={post.author.avatar} className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <h3 className="font-black text-stone-800 text-sm">{post.author.name}</h3>
                      <p className="text-[10px] text-stone-400 font-mono uppercase tracking-wider">{post.author.title} • {new Date(post.timestamp).toLocaleDateString()}</p>
                    </div>
                    <div className="ml-auto">
                      {post.tags.map(tag => (
                        <span key={tag} className="text-[9px] font-bold bg-stone-100 text-stone-500 px-2 py-1 rounded-md uppercase tracking-wider ml-2">{tag}</span>
                      ))}
                    </div>
                </div>

                {/* Content */}
                <p className="text-stone-700 font-medium leading-relaxed mb-4 whitespace-pre-wrap">{post.content}</p>
                
                {/* Post Media */}
                {post.image && (
                    <div className="mb-6 rounded-xl overflow-hidden border border-stone-100">
                        <img src={post.image} className="w-full h-auto object-cover max-h-96" />
                    </div>
                )}
                {post.link && (
                    <a href={post.link} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 bg-stone-50 p-3 rounded-xl mb-6 border border-stone-100 hover:bg-stone-100 transition-colors group">
                        <div className="bg-white p-2 rounded-lg shadow-sm text-blue-500"><ExternalLink size={16} /></div>
                        <span className="text-xs font-bold text-stone-600 truncate flex-1 group-hover:text-blue-600">{post.link}</span>
                    </a>
                )}

                {/* Actions */}
                <div className="flex items-center gap-6 border-t border-stone-50 pt-4">
                    <button 
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center gap-2 transition-colors group ${post.likedByMe ? 'text-rose-500' : 'text-stone-400 hover:text-rose-500'}`}
                    >
                      <Heart size={16} className={`transition-all ${post.likedByMe ? 'fill-rose-500 scale-110' : 'group-hover:fill-rose-500'}`} />
                      <span className="text-xs font-bold">{post.likes}</span>
                    </button>
                    <button 
                        onClick={() => toggleComments(post.id)}
                        className={`flex items-center gap-2 transition-colors ${isCommentsOpen ? 'text-blue-500' : 'text-stone-400 hover:text-blue-500'}`}
                    >
                      <MessageSquare size={16} className={isCommentsOpen ? 'fill-blue-500/20' : ''} />
                      <span className="text-xs font-bold">{post.comments}</span>
                    </button>
                </div>

                {/* Comment Section */}
                {isCommentsOpen && (
                    <div className="mt-6 pt-4 border-t border-stone-100 animate-in fade-in slide-in-from-top-2 duration-200">
                        {/* List */}
                        <div className="space-y-4 mb-6">
                            {(post.commentsList || []).map(comment => (
                                <div key={comment.id} className="flex gap-3">
                                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 mt-1">
                                        <img src={comment.author.avatar} className="w-full h-full object-cover" />
                                    </div>
                                    <div className="flex-1 bg-stone-50 p-3 rounded-2xl rounded-tl-none border border-stone-100">
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-xs font-bold text-stone-800">{comment.author.name}</span>
                                            <span className="text-[9px] text-stone-400 font-mono">{new Date(comment.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                        </div>
                                        <p className="text-xs text-stone-600 leading-relaxed">{comment.content}</p>
                                    </div>
                                </div>
                            ))}
                            {(!post.commentsList || post.commentsList.length === 0) && (
                                <p className="text-center text-xs text-stone-300 font-mono uppercase tracking-wider py-2">No comments yet</p>
                            )}
                        </div>

                        {/* Input */}
                        <div className="flex gap-3 items-center">
                             <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border border-stone-100">
                                {userProfile.avatar ? (
                                    <img src={userProfile.avatar} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full bg-stone-200" />
                                )}
                             </div>
                             <div className="flex-1 relative">
                                <input 
                                    value={commentInputs[post.id] || ''}
                                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [post.id]: e.target.value }))}
                                    onKeyDown={(e) => e.key === 'Enter' && handlePostComment(post.id)}
                                    placeholder="Add to discussion..."
                                    className="w-full bg-white border border-stone-200 rounded-xl py-2 pl-4 pr-10 text-xs font-medium outline-none focus:border-stone-800 transition-colors"
                                />
                                <button 
                                    onClick={() => handlePostComment(post.id)}
                                    disabled={!commentInputs[post.id]}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-stone-400 hover:text-blue-500 disabled:opacity-0 transition-all"
                                >
                                    <CornerDownRight size={14} />
                                </button>
                             </div>
                        </div>
                    </div>
                )}
              </div>
            );
        })}
        {filteredPosts.length === 0 && (
            <div className="text-center py-12">
                <p className="text-stone-300 font-mono text-xs uppercase tracking-widest">No discussions found</p>
            </div>
        )}
      </div>
    </div>
  );
};
