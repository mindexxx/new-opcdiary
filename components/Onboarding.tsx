import React, { useState, useEffect, useRef } from 'react';
import { UserProfile, Message, Language } from '../types';
import { ONBOARDING_STEPS_BASE } from '../constants';
import { getSteps, TRANSLATIONS } from '../translations';
import { RioCharacter, UserCharacter } from './Characters';
import { TypingIndicator } from './TypingIndicator';
import { ArrowRight, ImagePlus } from 'lucide-react';

interface OnboardingProps {
  onComplete: (profile: UserProfile) => void;
  lang: Language;
}

export const Onboarding: React.FC<OnboardingProps> = ({ onComplete, lang }) => {
  const [stepIndex, setStepIndex] = useState(-1);
  const [profile, setProfile] = useState<UserProfile>({
    companyName: '',
    description: '',
    devTime: '',
    audience: '',
    valuation: '',
    avatar: null,
    password: ''
  });
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRioTyping, setIsRioTyping] = useState(false);
  const [rioMood, setRioMood] = useState<'neutral' | 'happy' | 'thinking'>('neutral');

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const steps = getSteps(lang, ONBOARDING_STEPS_BASE);
  const t = TRANSLATIONS[lang];

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isRioTyping]);

  // Restart/Translate greeting if messages are empty or language changes at start
  useEffect(() => {
    if (messages.length === 0) {
      addRioMessage(t.greeting, 800).then(() => {
        setTimeout(() => nextStep(0), 1000);
      });
    }
  }, [lang]);

  const addRioMessage = async (text: string, delay: number = 1000) => {
    setIsRioTyping(true);
    setRioMood('thinking');
    return new Promise<void>((resolve) => {
      setTimeout(() => {
        setIsRioTyping(false);
        setRioMood('happy');
        setMessages(prev => [...prev, { sender: 'RIO', text, id: Date.now().toString() }]);
        setTimeout(() => setRioMood('neutral'), 1000);
        resolve();
      }, delay);
    });
  };

  const addUserMessage = (text: string | React.ReactNode) => {
    setMessages(prev => [...prev, { sender: 'USER', text, id: Date.now().toString() }]);
  };

  const nextStep = (index: number) => {
    if (index >= steps.length) {
      setTimeout(() => onComplete(profile), 1500);
      return;
    }
    setStepIndex(index);
    addRioMessage(steps[index].question);
  };

  const handleTextSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() && steps[stepIndex].type !== 'file') return;

    const currentStep = steps[stepIndex];
    setProfile(prev => ({ ...prev, [currentStep.field]: inputValue }));
    const displayValue = currentStep.type === 'password' ? '•'.repeat(inputValue.length) : inputValue;
    addUserMessage(displayValue);
    setInputValue('');

    if (currentStep.reaction) {
      await addRioMessage(currentStep.reaction, 600);
    }
    nextStep(stepIndex + 1);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        setProfile(prev => ({ ...prev, avatar: result }));
        addUserMessage(<img src={result} alt="Upload" className="w-16 h-16 rounded-full border-2 border-white shadow-sm object-cover" />);
        if (steps[stepIndex].reaction) await addRioMessage(steps[stepIndex].reaction, 800);
        nextStep(stepIndex + 1);
      };
      reader.readAsDataURL(file);
    }
  };

  const currentStep = stepIndex >= 0 && stepIndex < steps.length ? steps[stepIndex] : null;

  return (
    <div className="flex flex-col h-screen w-full max-w-4xl mx-auto overflow-hidden bg-[#FDFBF7]">
      <header className="p-6 text-center z-10">
        <h1 className="text-3xl font-black tracking-tighter text-stone-800">OPC DIARY</h1>
      </header>
      <div className="flex-1 relative flex flex-col justify-center items-center w-full px-4 md:px-8">
        <div className="w-full max-w-2xl h-[50vh] overflow-y-auto mb-8 pr-2 space-y-6 scrollbar-hide">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex w-full ${msg.sender === 'RIO' ? 'justify-start' : 'justify-end'} fade-in-up`}>
              <div className={`max-w-[80%] px-6 py-4 text-lg md:text-xl font-medium leading-relaxed rounded-3xl shadow-sm ${msg.sender === 'RIO' ? 'bg-white text-stone-800 rounded-bl-none border border-stone-100' : 'bg-stone-800 text-white rounded-br-none'}`}>
                {msg.text}
              </div>
            </div>
          ))}
          {isRioTyping && (
             <div className="flex w-full justify-start fade-in-up">
               <div className="bg-white px-4 py-2 rounded-3xl rounded-bl-none shadow-sm border border-stone-100">
                 <TypingIndicator />
               </div>
             </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="flex justify-between items-end w-full max-w-3xl mb-4 md:mb-8 px-4 md:px-12">
            <RioCharacter mood={rioMood} />
            <div className="flex-1 mx-4 md:mx-12 mb-8 relative z-20">
              {currentStep && !isRioTyping && (
                <div className="fade-in-up">
                   {currentStep.type === 'file' ? (
                     <div className="flex justify-center">
                       <label className="cursor-pointer flex items-center gap-3 bg-white hover:bg-stone-50 text-stone-800 px-6 py-4 rounded-2xl shadow-md border-2 border-stone-200 transition-all group">
                         <div className="bg-stone-100 p-2 rounded-full group-hover:bg-stone-200 transition-colors">
                            <ImagePlus className="w-6 h-6 text-stone-600" />
                         </div>
                         <span className="font-bold text-lg">{lang === 'en' ? 'Choose Avatar' : '选择头像'}</span>
                         <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                       </label>
                     </div>
                   ) : (
                    <form onSubmit={handleTextSubmit} className="relative w-full">
                      <input ref={inputRef} autoFocus type={currentStep.type} value={inputValue} onChange={(e) => setInputValue(e.target.value)} placeholder={currentStep.placeholder} className="w-full bg-transparent border-b-4 border-stone-300 focus:border-stone-800 text-xl md:text-2xl py-4 px-2 outline-none text-center font-mono placeholder:text-stone-300 transition-colors" />
                      <button type="submit" disabled={!inputValue.trim()} className="absolute right-0 top-1/2 -translate-y-1/2 p-2 text-stone-400 hover:text-stone-800 disabled:opacity-0 transition-all">
                        <ArrowRight size={32} />
                      </button>
                    </form>
                   )}
                </div>
              )}
            </div>
            <UserCharacter avatar={profile.avatar} />
        </div>
      </div>
    </div>
  );
};