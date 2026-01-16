
import React, { useState, useEffect } from 'react';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { UserProfile, Language } from './types';

function App() {
  const [view, setView] = useState<'onboarding' | 'dashboard'>('onboarding');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [lang, setLang] = useState<Language>('en');
  
  // Role Simulation for Testing: 'owner' | 'friend' | 'guest'
  const [currentRole, setCurrentRole] = useState<'owner' | 'friend' | 'guest'>('owner');

  useEffect(() => {
    // Basic logic: if URL has ?role=friend, we simulate being a friend
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get('role');
    if (roleParam === 'friend' || roleParam === 'guest' || roleParam === 'owner') {
      setCurrentRole(roleParam as any);
      // If visiting as friend/guest, we skip onboarding and show a mock profile
      if (roleParam !== 'owner') {
        setUserProfile({
          companyName: "Example Corp",
          description: "Building the future of nothing.",
          devTime: "2 Years",
          audience: "Dreamers",
          valuation: "$1M",
          avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
          projectUrl: "https://google.com",
          password: "123"
        });
        setView('dashboard');
      }
    }
  }, []);

  const handleOnboardingComplete = (profile: UserProfile) => {
    setUserProfile(profile);
    setCurrentRole('owner'); // Creator is always the owner
    setView('dashboard');
  };

  const toggleLang = () => {
      setLang(prev => prev === 'en' ? 'cn' : 'en');
  };

  return (
    <div className="antialiased text-stone-800 relative">
      {/* Role Indicator (Helpful for your testing) */}
      <div className="fixed bottom-4 left-4 z-50 flex gap-2">
        <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-sm border ${
          currentRole === 'owner' ? 'bg-stone-900 text-white' : 
          currentRole === 'friend' ? 'bg-blue-500 text-white' : 'bg-stone-200 text-stone-600'
        }`}>
          Role: {currentRole}
        </span>
      </div>

      <button 
        onClick={toggleLang}
        className="fixed top-4 right-4 z-50 bg-stone-900 text-white rounded-full shadow-lg hover:bg-black transition-all flex items-center justify-center w-10 h-10 font-bold font-mono text-xs border border-stone-700"
      >
        {lang === 'en' ? 'CN' : 'EN'}
      </button>

      {view === 'onboarding' && (
        <Onboarding onComplete={handleOnboardingComplete} lang={lang} />
      )}
      {view === 'dashboard' && userProfile && (
        <Dashboard profile={userProfile} lang={lang} role={currentRole} onReset={() => setView('onboarding')} />
      )}
    </div>
  );
}

export default App;
