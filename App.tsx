
import React, { useState, useEffect } from 'react';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';
import { UserProfile, Language } from './types';

function App() {
  const [view, setView] = useState<'loading' | 'login' | 'onboarding' | 'dashboard'>('loading');
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [lang, setLang] = useState<Language>('en');
  const [isSupervisor, setIsSupervisor] = useState(false);

  // Load "Database" on mount
  useEffect(() => {
    const loadData = () => {
        try {
            const users = JSON.parse(localStorage.getItem('opc_users') || '[]');
            setAllUsers(users);
            
            // Check if there was a last active session
            const lastActiveName = localStorage.getItem('opc_last_active_user');
            if (lastActiveName) {
                const found = users.find((u: UserProfile) => u.companyName === lastActiveName);
                if (found) setCurrentUser(found);
            }
        } catch (e) {
            console.error("Failed to load users", e);
        }
        setView('login');
    };
    loadData();
  }, []);

  const handleLoginAttempt = (name: string, pass: string) => {
    // 1. Check Supervisor
    if (name.toLowerCase() === 'daniel' && pass === 'generasia') {
        const supervisorProfile: UserProfile = {
            companyName: 'Supervisor',
            description: 'Overseeing operations.',
            devTime: 'Infinite',
            audience: 'All',
            valuation: '∞',
            avatar: null,
            password: '',
            title: 'System Admin'
        };
        setCurrentUser(supervisorProfile);
        setIsSupervisor(true);
        setView('dashboard');
        return true;
    }

    // 2. Check Real Users
    const foundUser = allUsers.find(u => 
        u.companyName.toLowerCase() === name.toLowerCase() && u.password === pass
    );

    if (foundUser) {
        setCurrentUser(foundUser);
        setIsSupervisor(false);
        localStorage.setItem('opc_last_active_user', foundUser.companyName);
        setView('dashboard');
        return true;
    }

    return false;
  };

  const handleStartSubscription = () => {
    setView('onboarding');
  };

  const handleOnboardingComplete = (profile: UserProfile) => {
    // Save new user to "Database"
    const updatedUsers = [...allUsers.filter(u => u.companyName !== profile.companyName), profile];
    
    setAllUsers(updatedUsers);
    
    try {
        localStorage.setItem('opc_users', JSON.stringify(updatedUsers));
        localStorage.setItem('opc_last_active_user', profile.companyName);
    } catch (e) {
        console.error("Storage Quota Exceeded", e);
        alert(lang === 'en' ? "Storage full! Registration success but local data not saved. Try clearing space." : "存储空间已满！注册成功但本地数据未保存。请尝试清理空间。");
    }
    
    setCurrentUser(profile);
    setIsSupervisor(false);
    setView('dashboard');
  };

  // Called when user edits profile in Dashboard
  const handleUpdateProfile = (updatedProfile: UserProfile) => {
      const updatedUsers = allUsers.map(u => u.companyName === updatedProfile.companyName ? updatedProfile : u);
      setAllUsers(updatedUsers);
      setCurrentUser(updatedProfile);
      try {
        localStorage.setItem('opc_users', JSON.stringify(updatedUsers));
      } catch (e) {
        console.error("Storage Quota Exceeded on update", e);
        alert(lang === 'en' ? "Failed to save profile updates (Storage Full)" : "保存个人资料失败（存储空间已满）");
      }
  };

  const handleDeleteUser = (username: string) => {
      // 1. Remove from list
      const updatedUsers = allUsers.filter(u => u.companyName !== username);
      setAllUsers(updatedUsers);
      localStorage.setItem('opc_users', JSON.stringify(updatedUsers));

      // 2. Cleanup associated data (Projects, Supervisor Chats)
      // Note: Friendship connections in 'opc_connections' might remain as 'ghosts' or can be cleaned up lazily
      localStorage.removeItem(`opc_projects_${username}`);
      localStorage.removeItem(`opc_instructions_${username}`);
      
      // Clear session if we deleted the current user (unlikely as supervisor does this, but good safety)
      if (currentUser?.companyName === username) {
          handleLogout();
      }
  };

  const handleLogout = () => {
    setIsSupervisor(false);
    setCurrentUser(null); // Clear current user session in memory
    localStorage.removeItem('opc_last_active_user');
    setView('login');
  };

  const toggleLang = () => setLang(prev => prev === 'en' ? 'cn' : 'en');

  if (view === 'loading') return <div className="min-h-screen bg-[#FDFBF7]" />;

  return (
    <div className="antialiased text-stone-800 relative bg-[#FDFBF7] min-h-screen">
      {/* Global Lang Toggle */}
      <button 
        onClick={toggleLang}
        className="fixed top-4 right-4 z-50 bg-white/80 backdrop-blur-sm text-stone-800 rounded-full shadow-sm hover:shadow-md transition-all flex items-center justify-center w-10 h-10 font-bold font-mono text-xs border border-stone-200"
      >
        {lang === 'en' ? 'CN' : 'EN'}
      </button>

      {view === 'login' && (
        <Login 
          lastUser={currentUser || (allUsers.length > 0 ? allUsers[allUsers.length -1] : null)}
          onLoginAttempt={handleLoginAttempt} 
          onSignup={handleStartSubscription}
          lang={lang}
        />
      )}

      {view === 'onboarding' && (
        <Onboarding 
            onComplete={handleOnboardingComplete} 
            onSupervisorLogin={() => handleLoginAttempt('daniel', 'generasia')}
            onBack={() => setView('login')}
            lang={lang} 
        />
      )}

      {view === 'dashboard' && currentUser && (
        <Dashboard 
          profile={currentUser} 
          lang={lang} 
          role="owner" 
          onReset={handleLogout}
          isSupervisor={isSupervisor}
          allUsers={allUsers}
          onUpdateProfile={handleUpdateProfile}
          onDeleteUser={handleDeleteUser}
        />
      )}
    </div>
  );
}

export default App;
