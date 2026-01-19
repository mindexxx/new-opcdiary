
import React, { useRef, useState, useEffect } from 'react';
import { DiaryEntry, Language } from '../types';
import { TRANSLATIONS } from '../translations';
import { MapPin, Image as ImageIcon, Sparkles, X } from 'lucide-react';

interface RoadmapProps {
  entries: DiaryEntry[];
  lang: Language;
  onImageClick: (url: string) => void;
}

export const Roadmap: React.FC<RoadmapProps> = ({ entries, lang, onImageClick }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [selectedEntry, setSelectedEntry] = useState<string | null>(null);
  const t = TRANSLATIONS[lang];

  // Prevent default scroll when zooming
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomSensitivity = 0.001;
      const newScale = Math.min(Math.max(0.5, transform.scale - e.deltaY * zoomSensitivity), 3);
      setTransform(prev => ({ ...prev, scale: newScale }));
    };

    container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container.removeEventListener('wheel', handleWheel);
  }, [transform.scale]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 2) return; // Right click handled by context menu
    setIsDragging(true);
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const dx = e.clientX - lastMouse.x;
    const dy = e.clientY - lastMouse.y;
    setTransform(prev => ({ ...prev, x: prev.x + dx, y: prev.y + dy }));
    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => setIsDragging(false);

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setTransform({ x: 0, y: 0, scale: 1 });
  };

  const getPath = () => {
    if (entries.length < 2) return '';
    let path = `M 50 150`; 
    entries.forEach((_, i) => {
        if (i === 0) return;
        path += ` L ${50 + i * 200} 150`;
    });
    return path;
  };

  return (
    <div className="w-full h-96 bg-stone-100 rounded-3xl overflow-hidden relative border border-stone-200 mt-8 group">
       <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-mono text-stone-500 border border-stone-200 pointer-events-none">
          {t.roadmapTip}
       </div>
       <div className="absolute top-4 right-4 z-10 text-xs font-mono text-stone-400 pointer-events-none">
          {t.resetView}
       </div>

      <div
        ref={containerRef}
        className={`w-full h-full cursor-${isDragging ? 'grabbing' : 'grab'}`}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={handleContextMenu}
        onClick={() => setSelectedEntry(null)} 
      >
        <div
          style={{
            transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
            transformOrigin: 'center left',
            transition: isDragging ? 'none' : 'transform 0.1s ease-out',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            paddingLeft: '50px'
          }}
        >
          <svg className="absolute top-0 left-0 h-full overflow-visible" style={{ width: Math.max(1000, entries.length * 200 + 100) }}>
             <path d={getPath()} stroke="#d6d3d1" strokeWidth="4" fill="none" strokeDasharray="8 4" />
          </svg>

          {entries.map((entry, index) => (
            <div
              key={entry.id}
              className="absolute top-1/2 -translate-y-1/2 flex flex-col items-center group/node cursor-pointer"
              style={{ left: `${50 + index * 200}px` }}
              onClick={(e) => {
                  e.stopPropagation();
                  setSelectedEntry(selectedEntry === entry.id ? null : entry.id);
              }}
            >
              <div 
                className={`w-12 h-12 rounded-full border-4 shadow-md flex items-center justify-center transition-all duration-300 z-10 hover:scale-110 overflow-hidden bg-cover bg-center
                    ${selectedEntry === entry.id ? 'scale-125 border-rose-500' : 'border-white bg-stone-200'}
                `}
                style={{
                    backgroundImage: entry.images.length > 0 ? `url(${entry.images[0]})` : undefined
                }}
              >
                 {entry.images.length === 0 && (
                     <MapPin size={20} className={selectedEntry === entry.id ? 'text-rose-500' : 'text-stone-500'} />
                 )}
              </div>

              {selectedEntry === entry.id && (
                  <div className={`
                     absolute bottom-full mb-4 w-64 bg-white p-4 rounded-xl shadow-xl border border-stone-100 z-20 cursor-auto
                     animate-[fadeInUp_0.2s_ease-out]
                  `}
                  onClick={(e) => e.stopPropagation()} 
                  >
                     <button 
                        onClick={() => setSelectedEntry(null)}
                        className="absolute top-2 right-2 text-stone-300 hover:text-stone-500"
                     >
                        <X size={14} />
                     </button>
                     <div className="flex items-center gap-2 mb-2">
                         <Sparkles size={14} className="text-purple-500" />
                         <span className="text-xs font-bold text-purple-600 uppercase">{t.aiSummary}</span>
                     </div>
                     <p className="text-sm text-stone-700 font-medium mb-2 leading-snug">
                        "{entry.content.substring(0, 50)}{entry.content.length > 50 ? '...' : ''}"
                     </p>
                     <span className="text-xs font-mono text-stone-400 block border-t border-stone-100 pt-2">
                         {new Date(entry.timestamp).toLocaleString()}
                     </span>
                     {entry.images.length > 0 && (
                         <div 
                            className="mt-2 rounded-lg overflow-hidden h-24 w-full border border-stone-100 cursor-zoom-in hover:opacity-90 transition-opacity"
                            onClick={() => onImageClick(entry.images[0])}
                         >
                             <img src={entry.images[0]} alt="Ref" className="w-full h-full object-cover" />
                         </div>
                     )}
                  </div>
              )}
              
              <div className="absolute top-full mt-4 font-mono text-xs font-bold text-stone-400 whitespace-nowrap">
                  {entry.date}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
