
import React, { useState, useEffect, useRef, memo } from 'react';
import { Heart, Clock, Tag, CircleDollarSign, MapPin, ChevronDown } from 'lucide-react';
import { Ad } from '../types';
import { getMediaUrl } from '../services/api';


interface AdCardProps {
  ad: Ad;
  onClick: (ad: Ad) => void;
  isFavorite?: boolean;
  onToggleFavorite?: (id: string) => void;
  isSubscribed?: boolean;
  variant?: 'default' | 'hero';
}

const AdCard: React.FC<AdCardProps> = memo(({ ad, onClick, isFavorite, onToggleFavorite, variant = 'default' }) => {
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
      if (isHovered || variant === 'hero') {
        videoRef.current.play().catch(() => { });
        if (variant === 'hero') videoRef.current.loop = true;
      } else {
        videoRef.current.pause();
        videoRef.current.currentTime = 0;
      }
    }
  }, [isHovered, variant]);

  if (!isVisible) {
    return (
      <div ref={cardRef} className="bg-slate-100 border border-slate-200 rounded-[40px] aspect-[3/4.5] animate-pulse" />
    );
  }

  const isVideo = ad.type === 'VSL' || (ad.mediaUrl || '').toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || (ad.mediaUrl || '').toLowerCase().includes('video') || (ad.mediaUrl || '').includes('blob:');
  const thumb = ad.thumbnail || `https://ui-avatars.com/api/?name=${encodeURIComponent(ad.title)}&background=1e293b&color=3b82f6&size=512&bold=true`;
  const [mediaError, setMediaError] = useState(false);

  if (variant === 'hero') {
    return (
      <div
        ref={cardRef}
        onClick={() => onClick(ad)}
        className="bg-white rounded-[40px] overflow-hidden transition-all duration-700 cursor-pointer flex flex-col h-full shadow-2xl relative border-4 border-amber-400 group hover:scale-[1.02] active:scale-95 aspect-[4/6]"
      >
        {/* Prize Glow Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-400/20 via-transparent to-blue-600/10 opacity-50 z-0" />

        <div className="relative flex-1 overflow-hidden bg-slate-900 flex items-center justify-center">
          {/* Shine Sweep Animation */}
          <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
            <div className="absolute -inset-full top-0 h-full w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent -skew-x-12 animate-[shimmer_3s_infinite]" />
          </div>

          {isVideo && !mediaError ? (
            <video
              ref={videoRef}
              src={getMediaUrl(ad.mediaUrl)}
              poster={getMediaUrl(thumb)}
              muted
              loop
              playsInline
              autoPlay
              className="w-full h-full object-cover"
              key={ad.mediaUrl}
              onError={() => setMediaError(true)}
            />
          ) : (
            <img
              src={getMediaUrl(thumb)}
              alt={ad.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=AD&background=1e293b&color=3b82f6&size=1024&bold=true`;
              }}
            />
          )}

          {/* Floating 'ACTIVE ADS' Badge - High Contrast Prize Style */}
          <div className="absolute top-6 left-6 z-20">
            <div className="bg-gradient-to-r from-red-600 to-rose-500 text-white px-6 py-3 rounded-2xl flex items-center gap-3 shadow-[0_10px_30px_-5px_rgba(225,29,72,0.6)] border border-white/20">
              <div className="w-2.5 h-2.5 bg-white rounded-full animate-pulse shadow-[0_0_10px_white]" />
              <span className="text-[14px] font-[900] uppercase tracking-tighter italic">
                {ad.adCount} ADS ATIVOS
              </span>
            </div>
          </div>

          {/* Title Overlay on Hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-10 gap-2 z-20">
            <h4 className="text-white font-[950] italic uppercase tracking-tighter text-2xl leading-none">
              {ad.title}
            </h4>
            <div className="flex items-center gap-2 text-amber-400 text-xs font-black uppercase tracking-widest italic">
              <MapPin size={12} fill="currentColor" className="text-amber-400" /> {ad.targeting?.locations?.[0]?.country || 'Brasil'}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Fallbacks otimizados com cores mais visíveis
  const brandLogo = ad.brandLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(ad.title)}&background=3b82f6&color=fff&size=256&bold=true`;
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
      className="bg-white rounded-[40px] overflow-hidden transition-all duration-500 group cursor-pointer flex flex-col h-full shadow-lg hover:shadow-2xl relative border border-slate-200 hover:scale-[1.01] animate-in fade-in slide-in-from-bottom-4 duration-700"
    >
      {/* HEADER BRANCO - DESTAQUE TOTAL */}
      <div className="bg-white p-6 pt-8 pb-6 relative z-10">
        <div className="flex items-start gap-4 mb-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 flex items-center justify-center overflow-hidden shrink-0 shadow-md border border-slate-100">
            <img
              src={getMediaUrl(brandLogo)}
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
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">NICHO:</span>
            <span className="text-[9px] font-black text-blue-600 uppercase italic truncate">{ad.niche}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <CircleDollarSign size={12} className="text-blue-500" strokeWidth={3} />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">TICKET:</span>
            <span className="text-[9px] font-black text-blue-600 uppercase italic">{ad.ticketPrice}</span>
          </div>
          <div className="flex items-center gap-1.5 col-span-2">
            <MapPin size={12} className="text-blue-500" strokeWidth={3} />
            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">REGIÃO:</span>
            <span className="text-[11px] leading-none ml-1">{primaryLocation.flag}</span>
            <span className="text-[9px] font-black text-blue-600 uppercase italic ml-0.5">{primaryLocation.country}</span>
          </div>
        </div>
      </div>

      {/* ÁREA DE MÍDIA - REFORÇADA PARA VISIBILIDADE */}
      <div className="relative flex-1 overflow-hidden bg-slate-50 min-h-[260px] flex items-center justify-center">
        {isVideo && !mediaError ? (
          <video
            ref={videoRef}
            src={getMediaUrl(ad.mediaUrl)}
            poster={getMediaUrl(thumb)}
            muted
            loop
            playsInline
            className="w-full h-full object-cover"
            key={ad.mediaUrl}
            onError={() => setMediaError(true)}
          />
        ) : (
          <img
            src={getMediaUrl(thumb)}
            alt={ad.title}
            className="w-full h-full object-cover"
            key={thumb}
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=AD&background=1e293b&color=3b82f6&size=512&bold=true`;
            }}
          />
        )}

        {mediaError && (
          <div className="absolute top-4 left-4 z-30 bg-rose-600/90 text-white px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border border-white/20 flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
            Link de Mídia Expirado
          </div>
        )}

        <div className="absolute bottom-6 right-6 z-20">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite?.(ad.id); }}
            className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all shadow-xl ${isFavorite
              ? 'bg-rose-500 text-white'
              : 'bg-white/80 backdrop-blur-md border border-slate-200 text-slate-400 hover:text-slate-900'
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
