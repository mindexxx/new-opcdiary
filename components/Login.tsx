
import React, { useState } from 'react';
import { UserProfile, Language } from '../types';
import { ArrowRight, Lock, RotateCcw } from 'lucide-react';

interface LoginProps {
  savedProfile: UserProfile | null;
  onLogin: () => void;
  onSignup: () => void;
  lang: Language;
}

export const Login: React.FC<LoginProps> = ({ savedProfile, onLogin, onSignup, lang }) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (savedProfile && password === savedProfile.password) {
      onLogin();
    } else {
      setError(true);
      setTimeout(() => setError(false), 500);
    }
  };

  const texts = {
    en: {
      welcomeBack: "Welcome Back",
      enterPass: "Enter Access Code",
      subscribe: "Subscribe to OPC",
      newHere: "First time here?",
      unlock: "Unlock",
      hint: "Hint: Try '123' if you are a guest",
      reset: "Not you? Create New Account"
    },
    cn: {
      welcomeBack: "欢迎回来",
      enterPass: "输入访问代码",
      subscribe: "订阅 OPC 日记",
      newHere: "第一次来？",
      unlock: "解锁",
      hint: "提示：如果是访客尝试 '123'",
      reset: "不是你？创建新账户"
    }
  };

  const t = texts[lang];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#FDFBF7]">
      <div className="text-center mb-12">
        <div className="w-16 h-16 bg-stone-900 rounded-2xl flex items-center justify-center shadow-xl mx-auto mb-6 rotate-3">
            <span className="text-white font-black text-2xl tracking-tighter">OPC</span>
        </div>
        <h1 className="text-4xl font-black tracking-tighter text-stone-800 uppercase">One Person Company</h1>
        <p className="text-stone-400 font-mono text-xs uppercase tracking-[0.4em] mt-2">Diary System V1.0</p>
      </div>

      <div className="w-full max-w-sm bg-white p-8 rounded-[2.5rem] shadow-2xl shadow-stone-200 border border-stone-100 relative overflow-hidden">
        {savedProfile ? (
          <div className="fade-in-up">
             <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 rounded-full border-4 border-stone-50 shadow-lg overflow-hidden mb-4">
                  {savedProfile.avatar ? (
                    <img src={savedProfile.avatar} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-stone-200" />
                  )}
                </div>
                <h2 className="text-xl font-black uppercase tracking-tight">{savedProfile.companyName}</h2>
                <p className="text-xs text-stone-400 font-mono uppercase tracking-widest mt-1">{t.welcomeBack}</p>
             </div>

             <form onSubmit={handleLogin} className="relative">
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-300" size={16} />
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t.enterPass}
                    className={`w-full bg-stone-50 py-4 pl-12 pr-4 rounded-2xl outline-none font-bold text-center text-stone-800 placeholder:text-stone-300 border-2 transition-all ${error ? 'border-rose-300 animate-shake' : 'border-transparent focus:border-stone-200'}`}
                    autoFocus
                  />
                </div>
                <button 
                  type="submit"
                  className="w-full mt-4 bg-stone-900 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-black transition-all flex items-center justify-center gap-2"
                >
                  {t.unlock} <ArrowRight size={16} />
                </button>
             </form>
             
             <div className="mt-6 text-center">
                <button 
                  onClick={onSignup} 
                  className="text-[10px] text-stone-400 hover:text-stone-600 font-bold uppercase tracking-widest flex items-center justify-center gap-1 mx-auto"
                >
                  <RotateCcw size={10} /> {t.reset}
                </button>
             </div>
          </div>
        ) : (
          <div className="text-center py-8 fade-in-up">
            <p className="text-stone-400 font-medium italic mb-8">{t.newHere}</p>
            <button 
              onClick={onSignup}
              className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black uppercase tracking-[0.2em] hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
            >
              {t.subscribe}
            </button>
          </div>
        )}
      </div>

      <div className="mt-12 text-center opacity-40">
        <p className="text-[10px] font-mono text-stone-400 uppercase tracking-widest">Secure Local Storage Access</p>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }
      `}</style>
    </div>
  );
};
