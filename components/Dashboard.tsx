
import React, { useState, useRef, useEffect } from 'react';
import { UserProfile, Language, Project, DiaryEntry, Group, Comment } from '../types';
import { TRANSLATIONS } from '../translations';
import { Plus, Search, Image as ImageIcon, Send, Trash2, Edit2, Layout, X, ArrowLeft, ArrowRight, ExternalLink, Camera, ChevronDown, ChevronUp, Save, BarChart3, Clock, DollarSign, TrendingUp, Globe } from 'lucide-react';
import { Roadmap } from './Roadmap';
import { MOCK_GROUPS } from '../constants';

interface DashboardProps {
  profile: UserProfile;
  lang: Language;
  role: 'owner' | 'friend' | 'guest';
  onReset?: () => void;
}

interface ProjectStats {
  stage: string;
  timeSpent: string;
  cost: string;
  profit: string;
}

const KEYWORD_LIB = {
  stage: {
    rd: ['研发', '开发', '制作', '研究', '代码', '程序', 'bug', 'debug', '编程', '前端', '后端', 'UI', '视觉', '交互', '优化', '迭代', '报错', 'dev', 'build', 'coding'],
    sales: ['卖', '销售', '交付', '交货', '赚', '买家', '买方', '甲方', '付钱', '钱', '价格', 'sales', 'order', 'client', 'payment'],
    ops: ['运维', '维护', '售后', '服务', '成本', '利润', '收入', '税', '稳', 'ops', 'support', 'maintenance']
  },
  finance: {
    cost: ['花了', '买了', '购买', '购入', '购置', '添置', '剁手', '成本', '费用', '支出', 'spent', 'cost', 'buy'],
    profit: ['赚了', '收入', '收了', '利润', '入账', '进账', '到账', 'earned', 'profit', 'revenue', 'income']
  }
};

export const Dashboard: React.FC<DashboardProps> = ({ profile: initialProfile, lang, role, onReset }) => {
  const t = TRANSLATIONS[lang];
  const isOwner = role === 'owner';
  const isGuest = role === 'guest';

  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editProfileData, setEditProfileData] = useState<UserProfile>(initialProfile);
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const [projectStats, setProjectStats] = useState<ProjectStats>({
    stage: lang === 'cn' ? '研发' : 'R&D',
    timeSpent: '0d',
    cost: '0',
    profit: '0'
  });
  const [editingStatKey, setEditingStatKey] = useState<keyof ProjectStats | null>(null);

  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDesc, setNewProjectDesc] = useState('');
  
  const [diaryInput, setDiaryInput] = useState('');
  const [diaryImage, setDiaryImage] = useState<string | null>(null);
  const [showAllEntries, setShowAllEntries] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleClickOutside = () => {
      setActiveTooltip(null);
      setEditingStatKey(null);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  useEffect(() => {
    if (!activeProject || activeProject.entries.length === 0) return;
    const analyzeProject = () => {
      const allEntries = activeProject.entries;
      const allText = allEntries.map(e => e.content).join(' ');
      let autoStage = projectStats.stage;
      if (KEYWORD_LIB.stage.ops.some(k => allText.includes(k))) autoStage = lang === 'cn' ? '运营' : 'Operations';
      else if (KEYWORD_LIB.stage.sales.some(k => allText.includes(k))) autoStage = lang === 'cn' ? '销售' : 'Sales';
      else if (KEYWORD_LIB.stage.rd.some(k => allText.includes(k))) autoStage = lang === 'cn' ? '研发' : 'R&D';
      const firstLogTime = Math.min(...allEntries.map(e => e.timestamp));
      const days = Math.max(1, Math.ceil((Date.now() - firstLogTime) / (1000 * 60 * 60 * 24)));
      const calcFinance = (keywords: string[]) => {
        let total = 0;
        allEntries.forEach(entry => {
          keywords.forEach(kw => {
            const regex = new RegExp(`${kw}\\s*(\\d+)`, 'gi');
            let match;
            while ((match = regex.exec(entry.content)) !== null) {
              total += parseInt(match[1], 10);
            }
          });
        });
        return total;
      };
      if (!editingStatKey) {
        setProjectStats({
          stage: autoStage,
          timeSpent: `${days}d`,
          cost: calcFinance(KEYWORD_LIB.finance.cost).toString(),
          profit: calcFinance(KEYWORD_LIB.finance.profit).toString()
        });
      }
    };
    analyzeProject();
  }, [activeProject?.entries, lang]);

  const handleSaveProfile = () => {
    setProfile(editProfileData);
    setIsEditingProfile(false);
  };

  const handleVisitProject = () => {
    if (profile.projectUrl) {
      let url = profile.projectUrl;
      if (!url.startsWith('http')) url = 'https://' + url;
      window.open(url, '_blank');
    }
  };

  const handleCreateProject = () => {
    if (!newProjectName.trim()) return;
    const newProj: Project = {
      id: Date.now().toString(),
      name: newProjectName,
      description: newProjectDesc,
      entries: []
    };
    setProjects([...projects, newProj]);
    setActiveProject(newProj);
    setIsCreatingProject(false);
    setNewProjectName('');
    setNewProjectDesc('');
  };

  const handlePublishDiary = () => {
    if (!activeProject || (!diaryInput.trim() && !diaryImage)) return;
    const now = new Date();
    const timeStr = now.toLocaleTimeString(lang === 'cn' ? 'zh-CN' : 'en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    const dateStr = now.toLocaleDateString(lang === 'cn' ? 'zh-CN' : 'en-US', { month: 'short', day: 'numeric' });
    const newEntry: DiaryEntry = {
      id: Date.now().toString(),
      content: diaryInput,
      images: diaryImage ? [diaryImage] : [],
      timestamp: Date.now(),
      date: `${dateStr} ${timeStr}`,
      comments: []
    };
    const updated = { ...activeProject, entries: [newEntry, ...activeProject.entries] };
    updateProjectState(updated);
    setDiaryInput('');
    setDiaryImage(null);
  };

  const handleDeleteEntry = (id: string) => {
    if (!activeProject) return;
    const updated = { ...activeProject, entries: activeProject.entries.filter(e => e.id !== id) };
    updateProjectState(updated);
  };

  const handleSaveEntry = (id: string) => {
    if (!activeProject) return;
    const updated = {
      ...activeProject,
      entries: activeProject.entries.map(e => e.id === id ? { ...e, content: editingContent } : e)
    };
    updateProjectState(updated);
    setEditingEntryId(null);
  };

  const updateProjectState = (updated: Project) => {
    setActiveProject(updated);
    setProjects(projects.map(p => p.id === updated.id ? updated : p));
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditProfileData({ ...editProfileData, avatar: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setEditProfileData({ ...editProfileData, projectCover: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const handleDiaryImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setDiaryImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] selection:bg-rose-100 selection:text-rose-900">
      {lightboxImage && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setLightboxImage(null)}>
          <img src={lightboxImage} className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl animate-in zoom-in-95 duration-300" alt="Fullscreen" />
          <button className="absolute top-8 right-8 text-white/50 hover:text-white transition-colors"><X size={32} /></button>
        </div>
      )}

      <nav className="sticky top-0 z-40 bg-[#FDFBF7]/80 backdrop-blur-md border-b border-stone-200 px-6 py-4 flex justify-between items-center">
        <h1 className="text-xl font-black tracking-tighter text-stone-800">OPC DIARY</h1>
        <div className="w-10 h-10 rounded-full bg-stone-100 border border-stone-200" />
      </nav>

      <main className="max-w-5xl mx-auto p-4 md:p-10">
        
        {/* --- FULL PROFILE CARD --- */}
        <div className="bg-white rounded-[40px] border border-stone-200 shadow-xl flex items-center mb-16 overflow-visible h-52 relative group/card">
          {isOwner && !isEditingProfile && (
            <button 
              onClick={() => { setEditProfileData(profile); setIsEditingProfile(true); }}
              className="absolute -top-4 -left-4 z-30 bg-stone-900 text-white p-4 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all"
            >
              <Edit2 size={18} />
            </button>
          )}

          <div 
            className={`w-52 h-full shrink-0 relative bg-stone-50 border-r border-stone-100 flex items-center justify-center overflow-hidden rounded-l-[39px] ${isEditingProfile ? 'cursor-pointer group/avatar-edit' : ''}`}
            onClick={() => isEditingProfile && avatarInputRef.current?.click()}
          >
            {(isEditingProfile ? editProfileData.avatar : profile.avatar) ? (
              <img src={isEditingProfile ? (editProfileData.avatar || '') : (profile.avatar || '')} className="w-full h-full object-cover" alt="Profile" />
            ) : (
              <div className="w-full h-full bg-rose-500" />
            )}
            {isEditingProfile && (
              <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover/avatar-edit:opacity-100 transition-opacity">
                <Camera className="text-white mb-2" size={32} />
                <span className="text-[10px] text-white font-black uppercase tracking-widest">{lang === 'en' ? 'Change' : '更换头像'}</span>
              </div>
            )}
            <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />
          </div>

          <div className="flex-1 px-12 min-w-0 h-full flex flex-col justify-center relative">
            {isEditingProfile ? (
              <div className="flex flex-col gap-3 py-4 max-h-full overflow-y-auto pr-4 scrollbar-hide">
                <div className="flex flex-col">
                  <label className="text-[9px] font-black text-stone-400 uppercase mb-1">{lang === 'en' ? 'Company Name' : '公司名称'}</label>
                  <input className="text-2xl font-black w-full border-b-2 border-stone-900 outline-none" value={editProfileData.companyName} onChange={e => setEditProfileData({...editProfileData, companyName: e.target.value})} />
                </div>
                <div className="flex flex-col">
                  <label className="text-[9px] font-black text-stone-400 uppercase mb-1">{lang === 'en' ? 'Project URL' : '项目网址'}</label>
                  <div className="flex items-center gap-2 border-b border-stone-200">
                    <Globe size={12} className="text-stone-300" />
                    <input className="text-xs text-blue-600 w-full outline-none font-bold py-1" value={editProfileData.projectUrl || ''} placeholder="https://example.com" onChange={e => setEditProfileData({...editProfileData, projectUrl: e.target.value})} />
                  </div>
                </div>
                <div className="flex flex-col">
                  <label className="text-[9px] font-black text-stone-400 uppercase mb-1">{lang === 'en' ? 'Bio' : '简介'}</label>
                  <input className="text-xs text-stone-500 w-full border-b border-stone-200 outline-none font-mono" value={editProfileData.description} onChange={e => setEditProfileData({...editProfileData, description: e.target.value})} />
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <input className="text-[10px] font-bold border-b border-stone-200 outline-none" value={editProfileData.valuation} placeholder="Valuation" onChange={e => setEditProfileData({...editProfileData, valuation: e.target.value})} />
                  <input className="text-[10px] font-bold border-b border-stone-200 outline-none" value={editProfileData.devTime} placeholder="Progress" onChange={e => setEditProfileData({...editProfileData, devTime: e.target.value})} />
                  <input className="text-[10px] font-bold border-b border-stone-200 outline-none" value={editProfileData.audience} placeholder="Target" onChange={e => setEditProfileData({...editProfileData, audience: e.target.value})} />
                </div>
                <div className="flex gap-4 mt-2 shrink-0">
                  <button onClick={handleSaveProfile} className="bg-stone-900 text-white px-6 py-2 rounded-xl text-[10px] font-black uppercase shadow-lg">Save</button>
                  <button onClick={() => setIsEditingProfile(false)} className="bg-stone-100 text-stone-400 px-6 py-2 rounded-xl text-[10px] font-black uppercase">Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <h2 className="text-4xl font-black text-stone-900 uppercase tracking-tighter leading-none mb-2">{profile.companyName}</h2>
                <div className="relative mb-6 self-start">
                  <p onClick={(e) => { e.stopPropagation(); setActiveTooltip(activeTooltip === 'bio' ? null : 'bio'); }} className={`cursor-pointer transition-colors font-mono text-sm truncate max-w-md leading-relaxed ${activeTooltip === 'bio' ? 'text-stone-900 font-bold underline decoration-rose-500/30 decoration-4' : 'text-stone-400 hover:text-stone-600'}`}>{profile.description}</p>
                  {activeTooltip === 'bio' && (
                    <div className="absolute top-full left-0 mt-4 w-72 p-6 bg-stone-900 text-white rounded-[32px] shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 aspect-square flex flex-col" onClick={e => e.stopPropagation()}>
                      <div className="font-black uppercase text-[10px] text-stone-500 tracking-[0.2em] mb-4 border-b border-stone-800 pb-2 flex justify-between"><span>STORY</span><X size={12} className="cursor-pointer" onClick={() => setActiveTooltip(null)}/></div>
                      <div className="flex-1 overflow-y-auto text-xs leading-relaxed text-stone-300 font-medium whitespace-pre-wrap pr-2">{profile.description}</div>
                      <div className="absolute -top-1.5 left-8 w-4 h-4 bg-stone-900 rotate-45" />
                    </div>
                  )}
                </div>
                <div className="flex gap-10">
                  {[
                    { key: 'val', label: lang === 'en' ? 'Valuation' : '估值', value: profile.valuation },
                    { key: 'pro', label: lang === 'en' ? 'Progress' : '进度', value: profile.devTime },
                    { key: 'tar', label: lang === 'en' ? 'Target' : '目标', value: profile.audience }
                  ].map(item => (
                    <div key={item.key} className="relative">
                      <div onClick={(e) => { e.stopPropagation(); setActiveTooltip(activeTooltip === item.key ? null : item.key); }} className={`flex flex-col cursor-pointer transition-transform ${activeTooltip === item.key ? 'scale-110' : 'hover:scale-105'}`}>
                        <span className="text-[10px] font-black text-stone-300 uppercase tracking-widest mb-1">{item.label}</span>
                        <span className={`text-sm font-black transition-colors ${activeTooltip === item.key ? 'text-rose-500' : 'text-stone-600'}`}>{item.value}</span>
                      </div>
                      {activeTooltip === item.key && (
                        <div className="absolute top-full left-0 mt-4 w-48 p-6 bg-stone-800 text-white rounded-[32px] shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 aspect-square flex flex-col" onClick={e => e.stopPropagation()}>
                          <div className="font-black uppercase text-[9px] text-stone-500 tracking-widest mb-3 border-b border-stone-700 pb-2 flex justify-between"><span>{item.label}</span><X size={10} className="cursor-pointer" onClick={() => setActiveTooltip(null)}/></div>
                          <div className="flex-1 flex items-center justify-center text-center text-sm font-black text-stone-100">{item.value}</div>
                          <div className="absolute -top-1.5 left-6 w-3 h-3 bg-stone-800 rotate-45" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="w-72 h-full border-l border-stone-100 bg-stone-50 overflow-hidden relative group/visit shrink-0 rounded-r-[39px]">
            {(isEditingProfile ? editProfileData.projectCover : profile.projectCover) ? (
              <img src={isEditingProfile ? (editProfileData.projectCover || '') : (profile.projectCover || '')} className="w-full h-full object-cover opacity-20 grayscale group-hover/visit:opacity-100 group-hover/visit:grayscale-0 group-hover/visit:scale-105 transition-all duration-700" alt="Cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center opacity-10"><Layout size={64} /></div>
            )}
            {!isEditingProfile && (
              <button onClick={handleVisitProject} className="absolute inset-0 z-10 opacity-0 group-hover/visit:opacity-100 bg-stone-900/80 text-white flex flex-col items-center justify-center transition-all duration-300 backdrop-blur-sm">
                <span className="font-black uppercase tracking-[0.3em] mb-2">{lang === 'en' ? 'Visit Project' : '访问项目'}</span>
                <ExternalLink size={24} />
              </button>
            )}
            {isEditingProfile && (
              <button onClick={() => coverInputRef.current?.click()} className="absolute top-4 right-4 z-30 bg-white p-4 rounded-full shadow-2xl hover:bg-rose-500 hover:text-white transition-all flex items-center gap-2">
                <ImageIcon size={18} /><span className="text-[10px] font-black uppercase tracking-widest">{lang === 'en' ? 'Cover' : '封面'}</span>
              </button>
            )}
            <input type="file" ref={coverInputRef} className="hidden" onChange={handleCoverUpload} />
          </div>
        </div>

        {!activeProject ? (
          <div className="fade-in-up">
            <div className="flex items-center gap-4 mb-10"><div className="w-12 h-1 bg-stone-200" /><h3 className="text-[10px] font-black text-stone-400 uppercase tracking-[0.4em]">{lang === 'en' ? 'Archive' : '档案库'}</h3></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {projects.map(p => (
                <div key={p.id} onClick={() => setActiveProject(p)} className="bg-white p-12 rounded-[56px] border border-stone-100 hover:border-stone-900 cursor-pointer transition-all hover:shadow-2xl group h-64 flex flex-col justify-between">
                  <div><h3 className="text-2xl font-black group-hover:text-rose-500 uppercase truncate mb-2">{p.name}</h3><p className="text-xs text-stone-400 font-medium line-clamp-3">{p.description}</p></div>
                  <div className="text-[9px] font-black text-stone-200 border-t border-stone-50 pt-6 tracking-widest uppercase">{p.entries.length} RECORDS</div>
                </div>
              ))}
              {isOwner && (
                <button onClick={() => setIsCreatingProject(true)} className="border-2 border-dashed border-stone-200 rounded-[56px] p-12 flex flex-col items-center justify-center text-stone-300 hover:border-stone-900 hover:text-stone-900 transition-all group h-64 bg-stone-50/30"><Plus size={40} className="mb-4 group-hover:scale-110 transition-transform" /><span className="font-black text-xs uppercase tracking-widest">{t.addProject}</span></button>
              )}
            </div>
          </div>
        ) : (
          <div className="fade-in-up">
            <button onClick={() => setActiveProject(null)} className="group flex items-center gap-4 bg-white px-8 py-4 rounded-3xl border border-stone-200 text-stone-400 hover:text-stone-900 transition-all shadow-sm mb-12"><ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" /><span className="font-black uppercase text-[11px] tracking-widest">{t.backToArchive}</span></button>
            <h2 className="text-7xl font-black text-stone-900 mb-4 uppercase tracking-tighter truncate">{activeProject.name}</h2>
            <p className="text-stone-400 font-mono text-xl mb-20 max-w-2xl leading-relaxed">{activeProject.description}</p>
            {isOwner && (
              <section className="bg-white rounded-[40px] border-2 border-stone-100 p-2 flex items-center shadow-2xl mb-24 max-w-3xl mx-auto ring-stone-900/5 focus-within:ring-[16px] transition-all">
                <input value={diaryInput} onChange={e => setDiaryInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handlePublishDiary()} placeholder={t.writeDiary} className="flex-1 bg-transparent px-8 py-5 outline-none font-bold text-xl placeholder:text-stone-200" />
                <div className="flex items-center gap-4 pr-3">
                   {diaryImage && <div className="relative w-12 h-12 rounded-xl overflow-hidden border border-stone-200"><img src={diaryImage} className="w-full h-full object-cover" alt="preview" /><button onClick={() => setDiaryImage(null)} className="absolute top-0 right-0 bg-rose-500 text-white p-0.5"><X size={10}/></button></div>}
                   <label className="cursor-pointer p-5 hover:bg-stone-50 rounded-2xl text-stone-300 hover:text-stone-900 transition-all"><ImageIcon size={28} /><input type="file" className="hidden" accept="image/*" onChange={handleDiaryImageUpload} /></label>
                   <button onClick={handlePublishDiary} className="bg-stone-900 text-white p-6 rounded-[32px] shadow-2xl hover:scale-105 active:scale-95 transition-all"><Send size={28} /></button>
                </div>
              </section>
            )}
            <section className="space-y-6 max-w-4xl mx-auto mb-40 relative pr-6">
              {(showAllEntries ? activeProject.entries : activeProject.entries.slice(0, 5)).map(entry => (
                <div key={entry.id} className="relative pl-36 py-2 group/entry">
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-32 text-right pr-10"><div className="text-[12px] font-black text-stone-900 uppercase leading-none mb-1">{entry.date.split(' ')[0]} {entry.date.split(' ')[1]}</div><div className="text-[10px] font-mono text-stone-300 uppercase leading-none tracking-widest">{entry.date.split(' ')[2]}</div></div>
                  <div className="absolute left-[133px] top-0 bottom-0 w-[1px] bg-stone-100" /><div className="absolute left-[128px] top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full bg-white border-2 border-stone-900 z-10 transition-transform group-hover/entry:scale-150" />
                  <div className="bg-white border border-stone-100 rounded-3xl px-8 py-5 shadow-sm hover:shadow-xl hover:border-stone-200 transition-all flex items-center justify-between gap-10 group/item">
                    <div className="flex-1 min-w-0"><div className="text-[8px] font-black text-stone-200 uppercase mb-2 tracking-[0.3em]">RECORD_LOG</div>
                      {editingEntryId === entry.id ? <input autoFocus className="w-full text-base font-bold outline-none bg-stone-50 px-3 py-2 rounded-xl" value={editingContent} onChange={e => setEditingContent(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveEntry(entry.id)} onBlur={() => handleSaveEntry(entry.id)} /> : <div className="flex items-center gap-4">{entry.images[0] && <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 cursor-zoom-in border border-stone-100" onClick={() => setLightboxImage(entry.images[0])}><img src={entry.images[0]} className="w-full h-full object-cover" alt="Log" /></div>}<p className="text-base text-stone-800 font-bold truncate leading-relaxed">{entry.content}</p></div>}
                    </div>
                    <div className="flex items-center gap-5 opacity-0 group-hover/item:opacity-100 transition-all transform translate-x-2 group-hover/item:translate-x-0"><button onClick={() => { setEditingEntryId(entry.id); setEditingContent(entry.content); }} className="text-stone-300 hover:text-stone-900 transition-colors"><Edit2 size={14} /></button><button onClick={() => handleDeleteEntry(entry.id)} className="text-stone-300 hover:text-rose-500 transition-colors"><Trash2 size={14} /></button></div>
                  </div>
                </div>
              ))}
              {activeProject.entries.length > 5 && <div className="pt-10 flex justify-center ml-32"><button onClick={() => setShowAllEntries(!showAllEntries)} className="bg-white border border-stone-200 px-10 py-3 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-stone-400 hover:text-stone-900 hover:border-stone-900 transition-all shadow-sm">{showAllEntries ? t.collapse : (lang === 'cn' ? '展开完整历史' : 'Expand History')}</button></div>}
            </section>
            <section className="mt-40 pt-20 border-t border-stone-100">
              <div className="flex items-center gap-5 mb-12"><div className="w-3 h-12 bg-stone-900 rounded-full" /><h2 className="text-4xl font-black text-stone-900 tracking-tight uppercase">{t.roadmap}</h2></div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
                {[
                  { key: 'stage', label: t.stage, value: projectStats.stage, icon: <BarChart3 size={20} />, color: 'bg-indigo-50 text-indigo-600' },
                  { key: 'timeSpent', label: t.timeSpent, value: projectStats.timeSpent, icon: <Clock size={20} />, color: 'bg-amber-50 text-amber-600' },
                  { key: 'cost', label: t.cost, value: `¥ ${projectStats.cost}`, icon: <DollarSign size={20} />, color: 'bg-rose-50 text-rose-600' },
                  { key: 'profit', label: t.profit, value: `¥ ${projectStats.profit}`, icon: <TrendingUp size={20} />, color: 'bg-emerald-50 text-emerald-600' }
                ].map(stat => (
                  <div key={stat.key} onClick={(e) => { e.stopPropagation(); setEditingStatKey(stat.key as keyof ProjectStats); }} className="bg-white p-10 rounded-[48px] border border-stone-100 hover:border-stone-900 transition-all group/stat cursor-pointer relative shadow-lg hover:shadow-2xl">
                    <div className="flex items-center justify-between mb-6"><div className={`p-4 rounded-3xl ${stat.color} transition-all group-hover/stat:scale-110 group-hover/stat:rotate-6`}>{stat.icon}</div><Edit2 size={14} className="text-stone-200 opacity-0 group-hover/stat:opacity-100 transition-opacity" /></div>
                    <div className="text-[11px] font-black text-stone-300 uppercase tracking-[0.2em] mb-2">{stat.label}</div>
                    {editingStatKey === stat.key ? <input autoFocus className="w-full text-3xl font-black outline-none bg-stone-50 px-3 py-2 rounded-2xl" value={projectStats[stat.key as keyof ProjectStats]} onChange={(e) => setProjectStats({ ...projectStats, [stat.key]: e.target.value })} onKeyDown={(e) => e.key === 'Enter' && setEditingStatKey(null)} onBlur={() => setEditingStatKey(null)} /> : <div className="text-4xl font-black text-stone-900 truncate tracking-tighter uppercase">{stat.value}</div>}
                  </div>
                ))}
              </div>
              <Roadmap entries={[...activeProject.entries].reverse()} lang={lang} onImageClick={setLightboxImage} />
            </section>
          </div>
        )}

        {isCreatingProject && (
          <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
            <div className="bg-white p-14 rounded-[72px] shadow-2xl w-full max-w-lg border-[6px] border-stone-900 animate-in zoom-in-95 duration-300">
              <h4 className="text-4xl font-black mb-12 uppercase text-center tracking-tighter">{lang === 'en' ? 'Startup Launch' : '启动新项目'}</h4>
              <div className="space-y-8">
                <div className="flex flex-col"><label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 px-2">Project Name</label><input className="w-full text-2xl font-black border-b-4 border-stone-100 focus:border-stone-900 outline-none py-3 px-2 transition-colors" placeholder={t.projectName} value={newProjectName} onChange={e => setNewProjectName(e.target.value)} /></div>
                <div className="flex flex-col"><label className="text-[10px] font-black text-stone-400 uppercase tracking-widest mb-2 px-2">Elevator Pitch</label><textarea className="w-full text-base text-stone-500 border-b-2 border-stone-100 focus:border-stone-900 outline-none py-3 px-2 resize-none transition-colors" rows={3} placeholder={t.projectDesc} value={newProjectDesc} onChange={e => setNewProjectDesc(e.target.value)} /></div>
              </div>
              <div className="flex gap-6 mt-14"><button onClick={handleCreateProject} className="flex-[2] bg-stone-900 text-white font-black py-5 rounded-[32px] text-base uppercase shadow-2xl hover:-translate-y-1 transition-transform active:scale-95">{t.create}</button><button onClick={() => setIsCreatingProject(false)} className="flex-1 bg-stone-100 text-stone-400 font-black py-5 rounded-[32px] text-base uppercase hover:bg-stone-200 transition-colors">{t.cancel}</button></div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
