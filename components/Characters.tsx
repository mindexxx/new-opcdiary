import React from 'react';

// Rio is a geometric, expressive character
export const RioCharacter: React.FC<{ mood?: 'neutral' | 'happy' | 'thinking' }> = ({ mood = 'neutral' }) => {
  return (
    <div className="relative w-24 h-24 md:w-32 md:h-32 transition-all duration-500 ease-in-out">
      {/* Body */}
      <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg">
        <path 
          d="M20,50 Q20,20 50,20 Q80,20 80,50 Q80,80 50,80 Q20,80 20,50" 
          fill="#3B82F6" 
          className="animate-[wiggle_4s_ease-in-out_infinite]"
        />
        {/* Glasses */}
        <g transform="translate(0, 5)">
            <circle cx="35" cy="45" r="8" fill="white" opacity="0.9" />
            <circle cx="65" cy="45" r="8" fill="white" opacity="0.9" />
            <line x1="43" y1="45" x2="57" y2="45" stroke="white" strokeWidth="2" />
        </g>
        
        {/* Eyes */}
        <g transform="translate(0, 5)">
            <circle cx="35" cy="45" r="3" fill="#1E3A8A" />
            <circle cx="65" cy="45" r="3" fill="#1E3A8A" />
        </g>

        {/* Mouth */}
        {mood === 'neutral' && <path d="M40,65 Q50,70 60,65" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />}
        {mood === 'happy' && <path d="M35,65 Q50,80 65,65" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />}
        {mood === 'thinking' && <circle cx="55" cy="68" r="3" fill="white" />}
      </svg>
      {/* Name Tag */}
      <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-blue-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-widest font-mono">
        RIO
      </div>
      <style>{`
        @keyframes wiggle {
          0%, 100% { d: path("M20,50 Q20,20 50,20 Q80,20 80,50 Q80,80 50,80 Q20,80 20,50"); }
          50% { d: path("M22,52 Q25,18 50,22 Q78,18 78,52 Q82,82 50,78 Q18,82 22,52"); }
        }
      `}</style>
    </div>
  );
};

// User is a placeholder that gets filled or remains abstract
export const UserCharacter: React.FC<{ avatar?: string | null }> = ({ avatar }) => {
  return (
    <div className="relative w-24 h-24 md:w-32 md:h-32 transition-all duration-500 ease-in-out">
      {avatar ? (
        <div className="w-full h-full rounded-full overflow-hidden border-4 border-rose-500 shadow-xl relative z-10">
          <img src={avatar} alt="User Avatar" className="w-full h-full object-cover" />
        </div>
      ) : (
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-lg opacity-80">
           <path 
            d="M20,50 Q20,20 50,20 Q80,20 80,50 Q80,80 50,80 Q20,80 20,50" 
            fill="#F43F5E"
            className="animate-[wiggleReverse_5s_ease-in-out_infinite]"
          />
          {/* Mystery Face */}
          <circle cx="35" cy="45" r="3" fill="#881337" />
          <circle cx="65" cy="45" r="3" fill="#881337" />
          <path d="M40,65 Q50,60 60,65" stroke="#881337" strokeWidth="3" fill="none" strokeLinecap="round" />
        </svg>
      )}
       <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-rose-900 text-white text-[10px] font-bold px-2 py-0.5 rounded-full tracking-widest font-mono z-20">
        YOU
      </div>
       <style>{`
        @keyframes wiggleReverse {
          0%, 100% { d: path("M20,50 Q20,20 50,20 Q80,20 80,50 Q80,80 50,80 Q20,80 20,50"); }
          50% { d: path("M18,48 Q22,25 50,18 Q75,25 82,48 Q78,75 50,82 Q25,75 18,48"); }
        }
      `}</style>
    </div>
  );
};