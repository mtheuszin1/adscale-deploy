
import React, { useState, useEffect, useRef, memo } from 'react';
import { Heart, Clock, Tag, CircleDollarSign, MapPin, ChevronDown } from 'lucide-react';
import { Ad } from '../types';


interface AdCardProps {
  ad: Ad;
  onClick: (ad: Ad) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  isSubscribed?: boolean;
}

const AdCard: React.FC<AdCardProps> = memo(({ ad, onClick, isFavorite, onToggleFavorite }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '400px', threshold: 0.01 }
    );
    if (cardRef.current) observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      if (isHovered) {
        videoRef.current.play().catch(() => { });
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isHovered]);

  if (!isVisible) {
    return (
      <div ref={cardRef} className="bg-slate-200 dark:bg-slate-800/20 border border-slate-200 dark:border-white/5 rounded-[40px] aspect-[3/4.5] animate-pulse" />
    );
  }

  const isVideo = ad.mediaUrl.toLowerCase().includes('.mp4') || ad.mediaUrl.toLowerCase().includes('video');

  // Fallbacks otimizados com cores mais visíveis
  const brandLogo = ad.brandLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(ad.title)}&background=3b82f6&color=fff&size=256&bold=true`;
  const thumb = ad.thumbnail || `https://ui-avatars.com/api/?name=${encodeURIComponent(ad.title)}&background=1e293b&color=3b82f6&size=512&bold=true`;
  const primaryLocation = ad.targeting?.locations?.[0] || { country: 'Brasil', flag: '🇧🇷' };

  const handleToggleExpand = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsExpanded(!isExpanded);
  };

  return (
    <div
      ref={cardRef}
      onClick={() => onClick(ad)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className="bg-white dark:bg-[#0a0f1e] rounded-[40px] overflow-hidden transition-all duration-500 group cursor-pointer flex flex-col h-full shadow-lg hover:shadow-2xl dark:shadow-2xl relative border border-slate-200 dark:border-white/5 hover:scale-[1.01] animate-in fade-in slide-in-from-bottom-4 duration-700"
    >
      {/* HEADER BRANCO - DESTAQUE TOTAL */}
      <div className="bg-white p-6 pt-8 pb-6 relative z-10">
        <div className="flex items-start gap-4 mb-6">
          {/* LOGO - Agora em fundo claro para contraste real */}
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 shadow-md border border-slate-100">
            <img
              src={brandLogo}
              className="w-full h-full object-cover"
              alt={ad.title}
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(ad.title)}&background=3b82f6&color=fff&bold=true`;
              }}
            />
          </div>

          <div className="flex flex-col gap-1 min-w-0">
            <h4 className="text-[14px] font-[900] text-slate-900 uppercase italic tracking-tighter leading-none truncate">
              {ad.title}
            </h4>

            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-red-600 shadow-[0_0_5px_rgba(220,38,38,0.4)]" />
              <span className="text-[12px] font-black text-red-600 uppercase italic leading-none tracking-tight">
                {ad.adCount} ATIVOS
              </span>
            </div>

            <div className="flex items-center gap-1 text-slate-400 font-black">
              <Clock size={12} strokeWidth={3} />
              <span className="text-[10px] uppercase italic leading-none tracking-tight">
                {ad.performance?.daysActive || 0} DIAS RODANDO
              </span>
            </div>
          </div>
        </div>

        <div className="mb-6">
          <p className={`text-[12px] text-slate-800 font-bold leading-snug italic transition-all duration-300 ${!isExpanded ? 'line-clamp-2' : ''}`}>
            "{ad.copy}"
          </p>
          <div
            onClick={handleToggleExpand}
            className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-2 flex items-center gap-1 italic hover:underline cursor-pointer"
          >
            <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : 'rotate-0'}`}>
              <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            </div>
            <span>{isExpanded ? 'MOSTRAR MENOS' : 'MOSTRAR MAIS'}</span>
          </div>
        </div>

        <div className="border-t-2 border-dashed border-slate-100 mb-5" />

        <div className="grid grid-cols-2 gap-y-3 gap-x-2">
          <div className="flex items-center gap-1.5">
            <Tag size={12} className="text-blue-500" strokeWidth={3} />
            <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest italic">NICHO:</span>
            <span className="text-[9px] font-black text-blue-600 dark:text-blue-500 uppercase italic truncate">{ad.niche}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CircleDollarSign size={12} className="text-blue-500" strokeWidth={3} />
            <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest italic">TICKET:</span>
            <span className="text-[9px] font-black text-blue-600 dark:text-blue-500 uppercase italic">{ad.ticketPrice}</span>
          </div>
          <div className="flex items-center gap-1.5 col-span-2">
            <MapPin size={12} className="text-blue-500" strokeWidth={3} />
            <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest italic">REGIÃO:</span>
            <span className="text-[11px] leading-none ml-1">{primaryLocation.flag}</span>
            <span className="text-[9px] font-black text-blue-600 dark:text-blue-500 uppercase italic ml-0.5">{primaryLocation.country}</span>
          </div>
        </div>
      </div>

      {/* ÁREA DE MÍDIA - REFORÇADA PARA VISIBILIDADE */}
      <div className="relative flex-1 overflow-hidden bg-slate-100 dark:bg-slate-900/50 min-h-[260px] flex items-center justify-center">
        {isVideo ? (
          <video
            ref={videoRef}
            src={ad.mediaUrl}
            poster={thumb}
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            key={ad.mediaUrl}
          />
        ) : (
          <img
            src={thumb}
            alt={ad.title}
            className="w-full h-full object-cover"
            key={thumb}
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=AD&background=1e293b&color=3b82f6&size=512&bold=true`;
            }}
          />
        )}

        <div className="absolute bottom-6 right-6 z-20">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(ad.id); }}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-xl ${isFavorite
              ? 'bg-rose-500 text-white'
              : 'bg-white/80 dark:bg-black/60 backdrop-blur-md border border-slate-200 dark:border-white/10 text-slate-400 dark:text-white/50 hover:text-slate-900 dark:hover:text-white'
              }`}
          >
            <Heart size={20} fill={isFavorite ? "currentColor" : "none"} strokeWidth={isFavorite ? 0 : 2.5} />
          </button>
        </div>
      </div>
    </div>
  );
});

export default AdCard;
