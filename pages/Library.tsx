
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Search, RefreshCw, ChevronDown, Globe, ChevronLeft, ChevronRight, ArrowUpDown, Loader2, Target, Layers, Library as LucideLibrary, Clock, MapPin } from 'lucide-react';
import { Ad, Platform, Niche } from '../types';
import AdCard from '../components/AdCard';
import ScannerModal from '../components/ScannerModal';


interface LibraryProps {
  ads: Ad[];
  onAdClick: (ad: Ad) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
  onClearBrand?: () => void;
  currentBrand?: string | null;
  title?: string;
  subtitle?: string;
  isSubscribed?: boolean;
  onNavigate?: (page: string) => void;
}

const Library: React.FC<LibraryProps> = ({ ads, onAdClick, favorites, onToggleFavorite, currentBrand, title = "Biblioteca", subtitle = "Base de dados completa interceptada", isSubscribed = false, onNavigate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [filterPlatform, setFilterPlatform] = useState<Platform | 'all'>('all');
  const [filterNiche, setFilterNiche] = useState<Niche | 'all'>('all');
  const [filterTimeframe, setFilterTimeframe] = useState<'all' | '24h' | '7d' | '30d'>('all');
  const [filterRegion, setFilterRegion] = useState<'all' | 'BR' | 'USA' | 'LATAM'>('all');
  const [minAds, setMinAds] = useState(0);
  const [sortBy, setSortBy] = useState<'newest' | 'active' | 'perf' | 'stability'>('perf');
  const [isSyncing, setIsSyncing] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  // Infinite Scroll State
  const [visibleCount, setVisibleCount] = useState(12);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Reset infinite scroll when filters change
  useEffect(() => {
    setVisibleCount(12);
  }, [debouncedSearchTerm, filterPlatform, filterNiche, filterTimeframe, filterRegion, minAds, sortBy, currentBrand]);

  const filteredAds = useMemo(() => {
    const result = ads.filter(ad => {
      const searchLower = debouncedSearchTerm.toLowerCase();
      // Enhanced Search Logic: Include Niche and Brand in search scope
      const matchesSearch =
        ad.title.toLowerCase().includes(searchLower) ||
        ad.copy.toLowerCase().includes(searchLower) ||
        ad.niche.toLowerCase().includes(searchLower) ||
        ad.brandId.toLowerCase().includes(searchLower);

      const matchesPlatform = filterPlatform === 'all' || ad.platform === filterPlatform;
      const matchesNiche = filterNiche === 'all' || ad.niche === filterNiche;
      const matchesAdsCount = ad.adCount >= minAds;
      const matchesBrand = !currentBrand || ad.brandId === currentBrand;

      let matchesTime = true;
      if (filterTimeframe !== 'all') {
        const adDate = new Date(ad.addedAt);
        const diffDays = (new Date().getTime() - adDate.getTime()) / (1000 * 3600 * 24);
        if (filterTimeframe === '24h') matchesTime = diffDays <= 1;
        else if (filterTimeframe === '7d') matchesTime = diffDays <= 7;
        else if (filterTimeframe === '30d') matchesTime = diffDays <= 30;
      }

      const matchesRegion = filterRegion === 'all' || ad.targeting.locations.some(l => l.country.includes(filterRegion));

      return matchesSearch && matchesPlatform && matchesNiche && matchesAdsCount && matchesBrand && matchesTime && matchesRegion;
    });

    // Intelligent Sorting Logic
    if (sortBy === 'perf') {
      // High Rating + High Volume
      result.sort((a, b) => (b.rating * b.adCount) - (a.rating * a.adCount));
    }
    else if (sortBy === 'newest') result.sort((a, b) => new Date(b.addedAt).getTime() - new Date(a.addedAt).getTime());
    else if (sortBy === 'active') result.sort((a, b) => b.adCount - a.adCount);
    else if (sortBy === 'stability') {
      // Stability = Oldest active ads (Longest running)
      result.sort((a, b) => new Date(a.addedAt).getTime() - new Date(b.addedAt).getTime());
    }

    return result;
  }, [ads, debouncedSearchTerm, filterPlatform, filterNiche, filterTimeframe, filterRegion, minAds, currentBrand, sortBy]);

  const handleSync = useCallback(() => {
    setIsSyncing(true);
    setTimeout(() => {
      setIsSyncing(false);
      window.dispatchEvent(new Event('databaseUpdated'));
    }, 800);
  }, []);

  // Intersection Observer to trigger "load more"
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredAds.length) {
          setVisibleCount(prev => prev + 12);
        }
      },
      { threshold: 0.1, rootMargin: '400px' }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [visibleCount, filteredAds.length]);

  const displayedAds = useMemo(() => {
    let list = filteredAds.slice(0, visibleCount);
    if (!isSubscribed) {
      // Show only 4 ads for non-subscribers
      list = filteredAds.slice(0, 4);
    }
    return list;
  }, [filteredAds, visibleCount, isSubscribed]);

  const FilterSelect = ({ value, options, onChange, icon: Icon, placeholder }: any) => (
    <div className="relative group min-w-[140px] flex-1 lg:flex-none">
      <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 dark:text-slate-500 group-hover:text-blue-600 dark:group-hover:text-white transition-colors pointer-events-none">
        {Icon && <Icon size={14} />}
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-white dark:bg-[#161E2E] hover:bg-slate-50 dark:hover:bg-[#1E293B] border border-slate-200 dark:border-white/[0.06] rounded-xl pl-9 pr-8 py-3 text-[10px] font-black text-slate-600 dark:text-slate-300 group-hover:text-slate-900 dark:group-hover:text-white uppercase tracking-widest focus:outline-none focus:border-blue-500 dark:focus:border-blue-600/50 appearance-none cursor-pointer transition-all w-full italic"
      >
        <option value="all">{placeholder}</option>
        {options.map((opt: any) => (
          <option key={typeof opt === 'string' ? opt : opt.value} value={typeof opt === 'string' ? opt : opt.value} className="bg-white dark:bg-[#161E2E] text-slate-700 dark:text-slate-300">
            {typeof opt === 'string' ? opt.toUpperCase() : opt.label.toUpperCase()}
          </option>
        ))}
      </select>
      <ChevronDown size={14} className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-600 pointer-events-none" />
    </div>
  );

  return (
    <div className="space-y-16 animate-in fade-in duration-700 max-w-[1800px] mx-auto pb-32">
      <div className="flex flex-col gap-10">
        <div className="flex flex-col md:flex-row items-end justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-2xl">
              <LucideLibrary size={28} />
            </div>
            <div>
              <h1 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900 dark:text-white leading-none mb-2">
                {title} <span className="text-blue-600 dark:text-blue-500">PRO</span>
              </h1>
              <p className="text-[11px] font-black text-slate-500 dark:text-slate-600 uppercase tracking-[0.4em] italic">{subtitle}</p>
            </div>
          </div>

          <button
            onClick={() => setIsScannerOpen(true)}
            className="bg-emerald-500 hover:bg-emerald-400 text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-2 transition-all shadow-xl shadow-emerald-500/20"
          >
            SCANNER IA <Target size={16} />
          </button>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-50 italic shadow-2xl shadow-blue-600/30"
          >
            {isSyncing ? 'SYNC...' : 'SYNC BASE'} {isSyncing ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
          </button>
        </div>

        {isScannerOpen && <ScannerModal onClose={() => setIsScannerOpen(false)} />}

        <div className="flex flex-col gap-6 bg-white dark:bg-[#0F172A] border border-slate-200 dark:border-white/[0.06] p-6 rounded-[40px] shadow-xl dark:shadow-2xl">
          <div className="relative w-full">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 dark:text-white/55" size={20} />
            <input
              type="text"
              placeholder="Busque por marca, ideia, padrão de copy ou sinal de escala..."
              className="w-full bg-slate-50 dark:bg-[#161E2E] border border-slate-200 dark:border-white/[0.06] rounded-[24px] py-6 pl-16 pr-8 text-sm font-black text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-white/55 focus:bg-white dark:focus:bg-[#1E293B] focus:outline-none focus:border-blue-500/50 dark:focus:border-blue-600/50 focus:shadow-[0_0_0_1px_rgba(37,99,235,0.2)] outline-none transition-all italic tracking-widest uppercase"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <FilterSelect icon={Target} placeholder="NICHO DE MERCADO" value={filterNiche} options={Object.values(Niche)} onChange={setFilterNiche} />
            <FilterSelect icon={Globe} placeholder="PLATAFORMA" value={filterPlatform} options={Object.values(Platform)} onChange={setFilterPlatform} />
            <FilterSelect icon={ArrowUpDown} placeholder="CRITÉRIO DE INTELIGÊNCIA" value={sortBy} options={[
              { value: 'perf', label: 'ADSCALE SCORE (RECOMENDADO)' },
              { value: 'active', label: 'VOLUME DE ESCALA (ADS ATIVOS)' },
              { value: 'stability', label: 'ESTABILIDADE (7+ DIAS)' },
              { value: 'newest', label: 'DADOS RECENTES (24H)' }
            ]} onChange={setSortBy} />

            <div className="flex items-center gap-6 bg-white dark:bg-[#161E2E] hover:bg-slate-50 dark:hover:bg-[#1E293B] border border-slate-200 dark:border-white/[0.06] px-8 py-4 rounded-xl flex-1 min-w-[300px] group transition-all">
              <Layers size={16} className="text-slate-400 dark:text-slate-500 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
              <div className="flex flex-col shrink-0">
                <span className="text-[9px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest group-hover:text-slate-900 dark:group-hover:text-white transition-colors">Filtro de Escala Mínima</span>
                <span className="text-sm font-black text-blue-600 dark:text-blue-500">{minAds > 0 ? `${minAds}+ Ads Ativos` : 'Todos os Sinais'}</span>
              </div>
              <input
                type="range" min="0" max="100" step="5" value={minAds}
                onChange={(e) => setMinAds(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-200 dark:bg-[#1E293B] rounded-full appearance-none cursor-pointer accent-blue-600 hover:accent-blue-500 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid de Resultados */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
        {displayedAds.map(ad => (
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

      {/* Paywall Banner for Non-Subscribers */}
      {!isSubscribed && (
        <div className="py-20 flex flex-col items-center justify-center text-center animate-in fade-in slide-in-from-bottom-10 duration-700">
          <div className="relative p-10 bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-[32px] max-w-2xl w-full shadow-2xl overflow-hidden group">
            {/* Glow effects */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-600/10 blur-[100px] rounded-full group-hover:bg-blue-600/20 transition-all duration-700" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-600/10 blur-[100px] rounded-full group-hover:bg-indigo-600/20 transition-all duration-700" />

            <div className="relative z-10 flex flex-col items-center gap-6">
              <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20 mb-2">
                <Target size={32} className="text-white" />
              </div>

              <div>
                <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">Desbloqueie a Base Completa</h3>
                <p className="text-slate-400 font-medium text-sm max-w-md mx-auto">
                  Você está visualizando apenas uma amostra. Assine o AdScale Pro para acessar milhares de anúncios, métricas de escala, funis completos e muito mais.
                </p>
              </div>

              <button
                onClick={() => onNavigate && onNavigate('pricing')}
                className="bg-white text-slate-950 px-10 py-4 rounded-xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10 flex items-center gap-3"
              >
                Ver Planos e Desbloquear
                <ChevronRight size={16} />
              </button>

              <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                Acesso imediato após confirmação
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Sentinel for Infinite Scroll - Only show if subscribed and has more items */}
      {isSubscribed && visibleCount < filteredAds.length && (
        <div ref={loadMoreRef} className="flex justify-center pt-20 pb-10">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] italic">Carregando mais sinais...</span>
          </div>
        </div>
      )}

      {/* Fim da Base */}
      {visibleCount >= filteredAds.length && filteredAds.length > 0 && (
        <div className="text-center pt-20 opacity-30">
          <div className="w-12 h-1 bg-slate-800 mx-auto rounded-full mb-6" />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] italic">Fim da base de dados interceptada</p>
        </div>
      )}

      {filteredAds.length === 0 && (
        <div className="py-48 text-center flex flex-col items-center justify-center">
          <div className="w-24 h-24 bg-slate-950 rounded-[32px] flex items-center justify-center mb-10 border border-slate-800 text-slate-800 shadow-2xl opacity-20">
            <LucideLibrary size={40} />
          </div>
          <h3 className="text-2xl font-black uppercase italic text-slate-500 tracking-tighter">Nenhum sinal encontrado com esses filtros</h3>
        </div>
      )}
    </div>
  );
};

export default Library;
