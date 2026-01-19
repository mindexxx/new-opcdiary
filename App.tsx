
import React, { useState, useEffect } from 'react';
import { Onboarding } from './components/Onboarding';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';
import { UserProfile, Language } from './types';

function App() {
  const [view, setView] = useState<'loading' | 'login' | 'onboarding' | 'dashboard'>('loading');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [lang, setLang] = useState<Language>('en');

  useEffect(() => {
    // Check local storage for existing user
    const savedProfile = localStorage.getItem('opc_user_profile');
    if (savedProfile) {
      try {
        const parsed = JSON.parse(savedProfile);
        setUserProfile(parsed);
        setView('login');
      } catch (e) {
        setView('login'); // Default to login screen which acts as landing
      }
    } else {
      setView('login'); // Show landing/login page first
    }
  }, []);

  const handleLoginSuccess = () => {
    setView('dashboard');
  };

  const handleStartSubscription = () => {
    setView('onboarding');
  };

  const handleOnboardingComplete = (profile: UserProfile) => {
    // Persist user
    localStorage.setItem('opc_user_profile', JSON.stringify(profile));
    setUserProfile(profile);
    setView('dashboard');
  };

  const handleLogout = () => {
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
          savedProfile={userProfile} 
          onLogin={handleLoginSuccess} 
          onSignup={handleStartSubscription}
          lang={lang}
        />
      )}

      {view === 'onboarding' && (
        <Onboarding onComplete={handleOnboardingComplete} lang={lang} />
      )}

      {view === 'dashboard' && userProfile && (
        <Dashboard 
          profile={userProfile} 
          lang={lang} 
          role="owner" 
          onReset={handleLogout} 
        />
      )}
    </div>
  );
}

export default App;
