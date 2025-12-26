
import React, { useState, useMemo } from 'react';
import { TrendingUp, Zap, Clock, Calendar, Target } from 'lucide-react';
import { Ad, AdStatus, Niche } from '../types';
import AdCard from '../components/AdCard';


interface ScalingLiveProps {
  ads: Ad[];
  onAdClick: (ad: Ad) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  isSubscribed?: boolean;
}

type Timeframe = 'today' | 'week' | 'month';

const ScalingLive: React.FC<ScalingLiveProps> = ({ ads, onAdClick, favorites, onToggleFavorite, isSubscribed = false }) => {
  const [timeframe, setTimeframe] = useState<Timeframe>('today');

  const filteredAds = useMemo(() => {
    return ads.filter(ad => {
      // Dados reais extraídos do CSV via dbService
      const days = ad.performance?.daysActive || 0;
      const isScaling = ad.status === AdStatus.SCALING || ad.adCount >= 3;

      // Definição de Nichos "Hot" (Apostas, Saúde, Finanças)
      const hotNiches = [Niche.BETTING, Niche.HEALTH, Niche.FINANCE];

      let matchesFilter = false;

      if (timeframe === 'today') {
        // "Escalando Hoje": Foco em criativos novos (<= 1 dia) com sinais de escala rápida
        matchesFilter = days <= 1 && isScaling;
      } else if (timeframe === 'week') {
        // "Tração na Semana": Foco em Nichos "HOTS" com tempo de veiculação intermediário (<= 7 dias)
        // Conforme solicitado: "em atração mostre nichos hots"
        matchesFilter = days <= 7 && hotNiches.includes(ad.niche);
      } else if (timeframe === 'month') {
        // "Monitor Mensal": Foco em nichos de escala sustentável (Info, Business, Drop) ou outros
        // que não sejam os "Hots" imediatistas, com tempo de vida de até 30 dias.
        matchesFilter = days <= 30 && !hotNiches.includes(ad.niche) && isScaling;
      }

      return matchesFilter && ad.isVisible !== false;
    }).sort((a, b) => b.adCount - a.adCount);
  }, [ads, timeframe]);

  return (
    <div className="space-y-12 animate-in fade-in duration-700 max-w-[1700px] mx-auto pb-32">
      {/* Header and Filter Tabs Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8 bg-slate-900/30 p-12 rounded-[56px] border border-white/5 backdrop-blur-3xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-emerald-500/5 blur-[120px] -z-10" />

        <div className="flex items-center gap-8">
          <div className="w-20 h-20 bg-emerald-500/10 rounded-[32px] flex items-center justify-center border border-emerald-500/20 text-emerald-500 shadow-2xl shadow-emerald-500/10">
            <TrendingUp size={40} />
          </div>
          <div>
            <h1 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white leading-none mb-3">
              Escalando <span className="text-emerald-500">Live</span>
            </h1>
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
              <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.5em] italic">
                SINAIS TÉCNICOS EM TEMPO REAL
              </p>
            </div>
          </div>
        </div>

        {/* Timeframe Selection - Design Ultra Clean sem subtextos */}
        <div className="flex flex-wrap gap-4 bg-black/40 p-2.5 rounded-[32px] border border-white/5 shadow-inner backdrop-blur-lg">
          {[
            { id: 'today', label: 'ESCALANDO HOJE', icon: <Zap size={16} /> },
            { id: 'week', label: 'TRAÇÃO NA SEMANA', icon: <Calendar size={16} /> },
            { id: 'month', label: 'MONITOR MENSAL', icon: <Clock size={16} /> }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setTimeframe(tab.id as Timeframe)}
              className={`flex items-center justify-center gap-3 px-12 py-5 rounded-[24px] text-[11px] font-black uppercase tracking-widest transition-all italic active:scale-95 min-w-[220px] ${timeframe === tab.id
                ? 'bg-[#10b981] text-white shadow-[0_15px_30px_-5px_rgba(16,185,129,0.4)] border border-emerald-400/30'
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5 border border-transparent'
                }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Results */}
      <div className="pt-4">
        {filteredAds.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 animate-in slide-in-from-bottom-8 duration-500">
            {filteredAds.map(ad => (
              <AdCard
                key={ad.id}
                ad={ad}
                onClick={onAdClick}
                isFavorite={favorites.includes(ad.id)}
                onToggleFavorite={onToggleFavorite}
                isSubscribed={isSubscribed}
              />
            ))}
          </div>
        ) : (
          <div className="py-48 text-center bg-slate-900/10 border border-white/5 rounded-[56px] flex flex-col items-center justify-center border-dashed">
            <div className="w-24 h-24 bg-slate-950 rounded-[32px] flex items-center justify-center mb-10 border border-slate-800 text-slate-800 shadow-2xl relative">
              <div className="absolute inset-0 bg-blue-500/10 blur-xl animate-pulse" />
              <Target size={40} className="text-slate-700 relative z-10" />
            </div>
            <h3 className="text-3xl font-black uppercase italic text-slate-500 mb-4 tracking-tighter">Filtro de Inteligência Ativo</h3>
            <p className="text-slate-600 font-bold text-xs uppercase tracking-widest italic">Não há criativos de nicho correspondente neste timeframe no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScalingLive;
