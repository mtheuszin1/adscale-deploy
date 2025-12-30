
import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Plus, Trash2, Database, Upload, AlertCircle, CheckCircle2,
  X, Loader2, Info, BrainCircuit, BarChart, Cloud,
  Zap, Sparkles, Activity, Search, DollarSign,
  RefreshCw, Settings, FileVideo, FileImage, Copy,
  ExternalLink, Trash, Save, Star, Eye, EyeOff, FolderOpen, HardDrive,
  Edit3, Trophy, LayoutGrid, ListFilter, ArrowUpRight, SortAsc,
  Settings2, ChevronRight, LayoutList, Target, TrendingUp,
  Filter, Pin, PinOff, ArrowUp, ArrowDown, CheckSquare, Square
} from 'lucide-react';
import { Ad, PlatformSettings, User, AdStatus, Niche, Platform } from '../types';
import { dbService } from '../services/dbService';
import { financeService } from '../services/financeService';
import { platformService } from '../services/platformService';
import CSVUploadWizard from '../components/CSVUploadWizard';
import AdEditorModal from '../components/AdEditorModal';

interface MediaAsset {
  id: string;
  name: string;
  url: string;
  type: 'video' | 'image';
  size: string;
  createdAt: string;
}

interface AdminProps {
  ads: Ad[];
  onAddAd: (ad: Ad) => void;
  onDeleteAd: (id: string) => void;
  onBatchUpdateAds?: (ads: Ad[]) => void;
}

const Admin: React.FC<AdminProps> = ({ ads, onAddAd, onDeleteAd, onBatchUpdateAds }) => {
  const [activeTab, setActiveTab] = useState<'data' | 'media' | 'finance' | 'store'>('data');
  const [activeDataView, setActiveDataView] = useState<'featured' | 'ranking' | 'topics'>('featured');
  const [isProcessing, setIsProcessing] = useState<string | null>(null);
  const [showCSVWizard, setShowCSVWizard] = useState(false);
  const [editingAd, setEditingAd] = useState<Ad | null>(null);
  const [assets, setAssets] = useState<MediaAsset[]>([]);

  // States para Filtros e Ordenação
  const [searchFilter, setSearchFilter] = useState('');
  const [platformFilter, setPlatformFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [nicheFilter, setNicheFilter] = useState<string>('all');
  const [regionFilter, setRegionFilter] = useState<string>('all');
  const [sortConfig, setSortConfig] = useState<{ key: string; direction: 'asc' | 'desc' }>({ key: 'displayOrder', direction: 'asc' });
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const [assetsSearch, setAssetsSearch] = useState('');
  const [selectedNiche, setSelectedNiche] = useState<Niche | 'all'>('all');

  const [config, setConfig] = useState(financeService.getConfig());
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const savedAssets = localStorage.getItem('adscale_media_vault');
    if (savedAssets) setAssets(JSON.parse(savedAssets));
  }, []);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      console.log('Link copied to clipboard');
    });
  };

  const saveAssets = (newAssets: MediaAsset[]) => {
    setAssets(newAssets);
    localStorage.setItem('adscale_media_vault', JSON.stringify(newAssets));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setIsProcessing('upload');
    Array.from(files).forEach((file: File) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const newAsset: MediaAsset = {
          id: Math.random().toString(36).substr(2, 9),
          name: file.name,
          url: event.target?.result as string,
          type: file.type.includes('video') ? 'video' : 'image',
          size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
          createdAt: new Date().toISOString()
        };
        saveAssets([newAsset, ...assets]);
        setIsProcessing(null);
      };
      reader.readAsDataURL(file);
    });
  };

  const deleteAsset = (id: string) => {
    saveAssets(assets.filter(a => a.id !== id));
  };

  const handleSaveAd = async (updatedAd: Ad) => {
    await dbService.updateAd(updatedAd);
    if (onBatchUpdateAds) onBatchUpdateAds([updatedAd]); // Adapt or remove if unnecessary
    setEditingAd(null);
  };

  const handleBatchUpdate = async (updateFn: (ad: Ad) => Ad) => {
    const allAds = await dbService.getAds();
    const modifiedAds = allAds.filter(a => selectedIds.has(a.id)).map(a => updateFn(a));
    await dbService.batchUpdate(modifiedAds);
    if (onBatchUpdateAds) onBatchUpdateAds(modifiedAds);
    setSelectedIds(new Set());
  };

  const toggleFeatured = async (ad: Ad) => {
    const updated = { ...ad, isFeatured: !ad.isFeatured };
    await handleSaveAd(updated);
  };

  const updateDisplayOrder = async (ad: Ad, order: number) => {
    const updated = { ...ad, displayOrder: order };
    await handleSaveAd(updated);
  };

  const toggleSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (filteredAds: Ad[]) => {
    if (selectedIds.size === filteredAds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredAds.map(a => a.id)));
    }
  };

  // Lógica de Filtragem e Ordenação para Home Frontline
  const managedFrontlineAds = useMemo(() => {
    // Primeiro filtramos
    let result = ads.filter(ad => {
      const matchesSearch = ad.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
        ad.id.toLowerCase().includes(searchFilter.toLowerCase());
      const matchesPlatform = platformFilter === 'all' || ad.platform === platformFilter;
      const matchesStatus = statusFilter === 'all' || ad.status === statusFilter;
      const matchesNiche = nicheFilter === 'all' || ad.niche === nicheFilter;
      const matchesRegion = regionFilter === 'all' || ad.targeting.locations.some(l => l.country.includes(regionFilter));

      return matchesSearch && matchesPlatform && matchesStatus && matchesNiche && matchesRegion;
    });

    // Depois ordenamos
    result.sort((a, b) => {
      let valA: any = a[sortConfig.key as keyof Ad];
      let valB: any = b[sortConfig.key as keyof Ad];

      if (sortConfig.key === 'displayOrder') {
        valA = a.displayOrder || 999;
        valB = b.displayOrder || 999;
      }

      if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
      if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [ads, searchFilter, platformFilter, statusFilter, nicheFilter, regionFilter, sortConfig]);

  // Lista específica apenas dos que estão no destaque (para o contador)
  const actualFeaturedAdsCount = ads.filter(a => a.isFeatured).length;

  const topAds = useMemo(() =>
    [...ads].sort((a, b) => b.adCount - a.adCount).slice(0, 20),
    [ads]);

  const nicheStats = useMemo(() => {
    const stats: Record<string, number> = {};
    ads.forEach(ad => {
      stats[ad.niche] = (stats[ad.niche] || 0) + 1;
    });
    return stats;
  }, [ads]);

  // Fix: Logic for Topic Explorer (added missing filteredByTopic memoized variable)
  const filteredByTopic = useMemo(() => {
    if (selectedNiche === 'all') return ads;
    return ads.filter(ad => ad.niche === selectedNiche);
  }, [ads, selectedNiche]);

  const availableCountries = useMemo(() => {
    const countries = new Set<string>();
    ads.forEach(ad => {
      ad.targeting?.locations?.forEach(l => {
        if (l.country) countries.add(l.country);
      });
    });
    return Array.from(countries).sort();
  }, [ads]);

  const getIntelBadge = (rating: number) => {
    if (rating >= 4.5) return <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase italic border border-emerald-500/20">HOT</span>;
    if (rating >= 4.0) return <span className="px-2 py-0.5 rounded-md bg-blue-500/10 text-blue-500 text-[8px] font-black uppercase italic border border-blue-500/20">FORTE</span>;
    return null;
  };

  const resetFilters = () => {
    setSearchFilter('');
    setPlatformFilter('all');
    setStatusFilter('all');
    setNicheFilter('all');
    setRegionFilter('all');
  };

  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-4 duration-700 max-w-[1600px] mx-auto pb-20">
      {showCSVWizard && (
        <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-6">
          <CSVUploadWizard onProcess={async (rows) => {
            console.log("[Admin] Iniciando processamento de", rows.length, "linhas do CSV");
            try {
              const newAds = rows.map(row => {
                // Robust key finding for analysis
                const getVal = (possible: string[]) => {
                  const key = Object.keys(row).find(k => possible.includes(k.toLowerCase().trim()));
                  return key ? row[key] : '';
                };

                const copy = getVal(['descrição', 'descrição ad', 'copy', 'text', 'texto', 'body']);
                const info = getVal(['info ads', 'active ads', 'anúncios ativos', 'count', 'quantidade']);

                return dbService.mapRowToAd(row, dbService.quickAnalyze(copy, info));
              });

              console.log(`[Admin] Mapeamento concluído. Enviando ${newAds.length} anúncios...`);
              await dbService.importAds(newAds);
              console.log("[Admin] Importação finalizada com sucesso. Fechando wizard.");
              setShowCSVWizard(false);

              // Atualizar lista local
              const updated = await dbService.getAds();
              if (onBatchUpdateAds) onBatchUpdateAds(updated);
            } catch (err) {
              console.error("[Admin] Erro fatal na importação:", err);
              throw err; // Repassa para o Wizard exibir
            }
          }} onCancel={() => setShowCSVWizard(false)} />
        </div>
      )}

      {editingAd && (
        <AdEditorModal ad={editingAd} onClose={() => setEditingAd(null)} onSave={handleSaveAd} />
      )}

      {/* Main Admin Header */}
      <header className="bg-white/80 backdrop-blur-xl p-8 rounded-[40px] border border-slate-200 shadow-2xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex flex-col">
          <h1 className="text-5xl font-black italic uppercase tracking-tighter text-slate-900 flex items-center gap-4">
            ADMIN <span className="text-blue-500">HUB</span>
          </h1>
          <p className="text-slate-500 font-mono text-[10px] tracking-[0.4em] uppercase italic mt-1">Gestão de Inteligência v4.8</p>
        </div>

        <nav className="flex gap-1 bg-slate-100 p-1.5 rounded-[24px] border border-slate-200">
          {[
            { id: 'data', label: 'Curadoria', icon: <Star size={14} /> },
            { id: 'media', label: 'Media Vault', icon: <HardDrive size={14} /> },
            { id: 'finance', label: 'Financeiro', icon: <DollarSign size={14} /> },
            { id: 'store', label: 'Config', icon: <Settings size={14} /> }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest italic transition-all flex items-center gap-2 ${activeTab === tab.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </nav>
      </header>

      {/* DATA VIEW (Curadoria) */}
      {activeTab === 'data' && (
        <div className="space-y-12 animate-in fade-in duration-500">

          {/* Sub-Navigation Visual System */}
          <div className="flex flex-col lg:flex-row justify-between items-center gap-8 bg-slate-100 p-4 rounded-[32px] border border-slate-200">
            <div className="flex gap-2 w-full lg:w-auto overflow-x-auto pb-2 lg:pb-0 custom-scrollbar">
              {[
                { id: 'featured', label: 'Home Frontline', icon: <LayoutList size={18} />, desc: 'Gestão da vitrine principal' },
                { id: 'ranking', label: 'Top Intelligence', icon: <Trophy size={18} />, desc: 'Elite por volume de ativos' },
                { id: 'topics', label: 'Topic Explorer', icon: <Target size={18} />, desc: 'Segmentação por nichos' }
              ].map(v => (
                <button
                  key={v.id}
                  onClick={() => setActiveDataView(v.id as any)}
                  className={`relative group px-6 py-4 rounded-2xl flex items-center gap-4 transition-all shrink-0 ${activeDataView === v.id
                    ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20'
                    : 'text-slate-400 hover:text-slate-700 hover:bg-slate-200/50'
                    }`}
                >
                  <div className={`${activeDataView === v.id ? 'text-white' : 'text-slate-700 group-hover:text-blue-500'} transition-colors`}>
                    {v.icon}
                  </div>
                  <div className="text-left">
                    <span className="block text-[10px] font-black uppercase italic tracking-widest leading-none mb-1">{v.label}</span>
                    <span className={`block text-[8px] font-bold uppercase italic opacity-40 leading-none ${activeDataView === v.id ? 'text-white' : ''}`}>{v.desc}</span>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex items-center gap-4 w-full lg:w-auto">
              <button
                onClick={async () => {
                  try {
                    setIsProcessing('region');
                    const count = await dbService.reprocessRegions();
                    alert(`${count} sinais tiveram suas regiões corrigidas pela IA.`);
                    setIsProcessing(null);
                  } catch (e: any) {
                    console.error("Full error detail:", e);
                    alert(`Erro ao reprocessar regiões: ${e.message || 'Erro desconhecido'}`);
                    setIsProcessing(null);
                  }
                }}
                disabled={isProcessing === 'region'}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest italic flex items-center gap-2 shadow-xl shadow-indigo-600/30 transition-all active:scale-95 whitespace-nowrap disabled:opacity-50"
              >
                {isProcessing === 'region' ? <Loader2 className="animate-spin" size={14} /> : <BrainCircuit size={14} />}
                Atualizar Ultra Inteligência (IA)
              </button>
              <button
                onClick={() => setShowCSVWizard(true)}
                className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest italic flex items-center gap-2 shadow-xl shadow-blue-600/30 transition-all active:scale-95 whitespace-nowrap"
              >
                <Upload size={14} /> Importar CSV
              </button>
              <button
                onClick={async () => {
                  if (window.confirm("ATENÇÃO: Isso irá excluir TODOS os anúncios do banco de dados permanentemente. Continuar?")) {
                    setIsProcessing('clear');
                    try {
                      await dbService.clearAllAds();
                      alert("Banco de dados limpo com sucesso.");
                    } catch (e: any) {
                      alert("Erro ao limpar banco: " + e.message);
                    } finally {
                      setIsProcessing(null);
                    }
                  }
                }}
                disabled={isProcessing === 'clear'}
                className="bg-rose-600 hover:bg-rose-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest italic flex items-center gap-2 shadow-xl shadow-rose-600/30 transition-all active:scale-95 whitespace-nowrap disabled:opacity-50"
              >
                {isProcessing === 'clear' ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />} LIMPAR TUDO
              </button>
            </div>
          </div>

          {/* VIEW: FRONTLINE HOME (Featured Management Enhanced) */}
          {activeDataView === 'featured' && (
            <div className="bg-white border border-slate-200 rounded-[48px] p-10 shadow-sm animate-in slide-in-from-right-8 duration-500">

              {/* Header de Seção com Bulk Actions */}
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4">
                <div>
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 flex items-center gap-3">
                    <LayoutList className="text-blue-500" /> Home Frontline
                  </h3>
                  <p className="text-[11px] font-black text-slate-500 uppercase italic tracking-widest mt-1">Gerencie quais sinais aparecem em destaque na página inicial.</p>
                </div>
                <div className="flex items-center gap-3">
                  {selectedIds.size > 0 && (
                    <div className="flex items-center gap-2 bg-blue-600 p-1.5 rounded-2xl animate-in zoom-in-95 duration-300">
                      <span className="px-4 text-[10px] font-black text-white uppercase italic">{selectedIds.size} selecionados</span>
                      <button onClick={() => handleBatchUpdate(a => ({ ...a, isFeatured: true }))} className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-xl transition-all" title="Adicionar ao Frontline"><Pin size={16} /></button>
                      <button onClick={() => handleBatchUpdate(a => ({ ...a, isFeatured: false }))} className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-xl transition-all" title="Remover do Frontline"><PinOff size={16} /></button>
                      <button onClick={() => handleBatchUpdate(a => ({ ...a, status: AdStatus.SCALING }))} className="bg-white/10 hover:bg-white/20 text-white p-2.5 rounded-xl transition-all" title="Mudar para Escalando"><TrendingUp size={16} /></button>
                      <button
                        onClick={async () => {
                          if (window.confirm(`Deseja excluir os ${selectedIds.size} anúncios selecionados?`)) {
                            setIsProcessing('batch-delete');
                            try {
                              await dbService.batchDeleteAds(Array.from(selectedIds));
                              setSelectedIds(new Set());
                            } catch (e: any) {
                              alert("Erro ao excluir: " + e.message);
                            } finally {
                              setIsProcessing(null);
                            }
                          }
                        }}
                        className="bg-rose-500/20 hover:bg-rose-500 text-rose-500 hover:text-white p-2.5 rounded-xl transition-all"
                        title="Excluir Selecionados"
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className="w-px h-6 bg-white/20 mx-1" />
                      <button onClick={() => setSelectedIds(new Set())} className="p-2.5 text-white/60 hover:text-white"><X size={16} /></button>
                    </div>
                  )}
                  <div className="px-5 py-2.5 bg-slate-100 text-slate-500 rounded-xl text-[10px] font-black uppercase italic border border-slate-200">
                    {actualFeaturedAdsCount} Sinais Ativos
                  </div>
                  <div className="px-5 py-2.5 bg-slate-50 text-slate-400 rounded-xl text-[10px] font-black uppercase italic border border-slate-200">
                    Capacidade Max: 12
                  </div>
                </div>
              </div>

              {/* BARRA DE FILTROS AVANÇADOS */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mb-8 bg-slate-50 p-6 rounded-[32px] border border-slate-200">
                <div className="lg:col-span-2 relative">
                  <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Buscar sinal, marca ou ID..."
                    className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-4 text-[10px] font-black uppercase italic text-slate-900 outline-none focus:border-blue-500 transition-all"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                  />
                </div>
                <select
                  value={platformFilter}
                  onChange={(e) => setPlatformFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-4 text-[10px] font-black uppercase italic text-slate-500 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">Plataforma: Todas</option>
                  {Object.values(Platform).map(p => <option key={p} value={p}>{p}</option>)}
                </select>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-4 text-[10px] font-black uppercase italic text-slate-500 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">Status: Todos</option>
                  {Object.values(AdStatus).map(s => <option key={s} value={s}>{s}</option>)}
                </select>
                <select
                  value={nicheFilter}
                  onChange={(e) => setNicheFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-4 text-[10px] font-black uppercase italic text-slate-500 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">Nicho: Todos</option>
                  {Object.values(Niche).map(n => <option key={n} value={n}>{n}</option>)}
                </select>
                <select
                  value={regionFilter}
                  onChange={(e) => setRegionFilter(e.target.value)}
                  className="bg-white border border-slate-200 rounded-xl px-4 py-4 text-[10px] font-black uppercase italic text-slate-500 outline-none focus:border-blue-500 cursor-pointer"
                >
                  <option value="all">País: Todos</option>
                  {availableCountries.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <button
                  onClick={resetFilters}
                  className="flex items-center justify-center gap-2 text-[10px] font-black uppercase italic text-slate-400 hover:text-slate-900 transition-all border border-slate-200 rounded-xl hover:bg-slate-100"
                >
                  <RefreshCw size={14} /> Resetar Filtros
                </button>
              </div>

              {/* TABELA DE GESTÃO */}
              <div className="overflow-x-auto bg-slate-50 rounded-[32px] border border-slate-200">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-100">
                      <th className="p-6 w-10">
                        <button onClick={() => toggleSelectAll(managedFrontlineAds)} className="text-slate-400 hover:text-slate-900 transition-colors">
                          {selectedIds.size === managedFrontlineAds.length && managedFrontlineAds.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                        </button>
                      </th>
                      <th onClick={() => toggleSort('displayOrder')} className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-slate-900 transition-colors">
                        <div className="flex items-center gap-2">
                          Display Order {sortConfig.key === 'displayOrder' && (sortConfig.direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
                        </div>
                      </th>
                      <th onClick={() => toggleSort('title')} className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest cursor-pointer hover:text-white transition-colors">
                        <div className="flex items-center gap-2">
                          Sinal Intelligence {sortConfig.key === 'title' && (sortConfig.direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
                        </div>
                      </th>
                      <th onClick={() => toggleSort('adCount')} className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center cursor-pointer hover:text-white transition-colors">
                        <div className="flex items-center justify-center gap-2">
                          Volume Ads {sortConfig.key === 'adCount' && (sortConfig.direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
                        </div>
                      </th>
                      <th onClick={() => toggleSort('status')} className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center cursor-pointer hover:text-white transition-colors">
                        <div className="flex items-center justify-center gap-2">
                          Status {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? <ArrowUp size={10} /> : <ArrowDown size={10} />)}
                        </div>
                      </th>
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações de Controle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {managedFrontlineAds.map((ad, idx) => (
                      <tr key={ad.id} className={`group hover:bg-slate-100 transition-all ${selectedIds.has(ad.id) ? 'bg-blue-600/5' : ''}`}>
                        <td className="p-6">
                          <button onClick={() => toggleSelection(ad.id)} className={`${selectedIds.has(ad.id) ? 'text-blue-500' : 'text-slate-700 hover:text-slate-500'} transition-colors`}>
                            {selectedIds.has(ad.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                          </button>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <span className="text-[10px] font-mono text-slate-500">#{idx + 1}</span>
                            <input
                              type="number"
                              className="w-14 bg-white border border-slate-200 rounded-xl p-2 text-[10px] font-black text-center text-blue-500 focus:border-blue-500 outline-none"
                              value={ad.displayOrder || 0}
                              onChange={(e) => updateDisplayOrder(ad, parseInt(e.target.value))}
                            />
                          </div>
                        </td>
                        <td className="p-6">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 group-hover:scale-105 transition-transform relative">
                              <img src={ad.brandLogo} className="w-full h-full object-cover" alt="" />
                              {ad.isFeatured && <div className="absolute top-0 right-0 bg-blue-600 p-0.5 rounded-bl-lg shadow-md"><Star size={10} className="text-white" fill="currentColor" /></div>}
                            </div>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                {ad.targeting?.locations?.[0]?.flag && <span className="text-sm scale-125 mr-1" title={ad.targeting.locations[0].country}>{ad.targeting.locations[0].flag}</span>}
                                <span className="block text-[12px] font-black uppercase italic text-slate-900 leading-none">{ad.title}</span>
                                {getIntelBadge(ad.rating)}
                              </div>
                              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{ad.niche} • {ad.platform}</span>
                            </div>
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/5 text-blue-500 rounded-lg text-[11px] font-black italic">
                            <TrendingUp size={12} /> {ad.adCount}
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          <div className={`inline-block px-4 py-1.5 rounded-xl text-[9px] font-black uppercase italic ${ad.status === AdStatus.SCALING ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' :
                            ad.status === AdStatus.VALIDATED ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                              'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                            }`}>
                            {ad.status}
                          </div>
                        </td>
                        <td className="p-6 text-right">
                          <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={() => toggleFeatured(ad)}
                              className={`p-3 rounded-xl border transition-all ${ad.isFeatured ? 'bg-blue-600 text-white border-blue-500' : 'bg-white text-slate-400 border-slate-200'}`}
                              title={ad.isFeatured ? "Remover do Destaque" : "Fixar no Destaque"}
                            >
                              {ad.isFeatured ? <PinOff size={16} /> : <Pin size={16} />}
                            </button>
                            <button onClick={() => setEditingAd(ad)} className="p-3 bg-white text-slate-400 hover:text-slate-900 rounded-xl border border-slate-200 transition-all">
                              <Edit3 size={16} />
                            </button>
                            <button onClick={() => onDeleteAd(ad.id)} className="p-3 bg-rose-500/10 text-rose-500 hover:bg-rose-500 hover:text-white rounded-xl transition-all">
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {managedFrontlineAds.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-24 text-center">
                          <div className="flex flex-col items-center gap-4 text-slate-500 opacity-30 italic">
                            <LayoutList size={48} />
                            <span className="text-[10px] font-black uppercase tracking-[0.5em]">Nenhum sinal encontrado com os filtros aplicados</span>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* VIEW: TOP 20 RANKING */}
          {activeDataView === 'ranking' && (
            <div className="bg-white border border-slate-200 rounded-[48px] p-10 shadow-sm animate-in slide-in-from-right-8 duration-500">
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900 flex items-center gap-3">
                    <Trophy className="text-amber-500" /> Top 20 Intelligence
                  </h3>
                  <p className="text-[11px] font-black text-slate-500 uppercase italic tracking-widest mt-1">Os maiores sinais da rede classificados por volume de ativos e autoridade.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                {topAds.map((ad, idx) => (
                  <div key={ad.id} className="bg-slate-50 border border-slate-200 p-6 rounded-[32px] flex flex-col md:flex-row items-center justify-between gap-6 group hover:border-blue-500/40 transition-all">
                    <div className="flex items-center gap-8 flex-1">
                      <span className={`text-4xl font-black italic italic tracking-tighter ${idx < 3 ? 'text-blue-500' : 'text-slate-300'}`}>
                        {(idx + 1).toString().padStart(2, '0')}
                      </span>
                      <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden border border-slate-200 group-hover:scale-105 transition-transform">
                        <img src={ad.brandLogo} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div>
                        <h4 className="text-xl font-black uppercase italic text-slate-900 leading-none mb-1">{ad.title}</h4>
                        <div className="flex items-center gap-3">
                          <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">{ad.niche}</span>
                          <span className="w-1 h-1 bg-slate-700 rounded-full" />
                          <span className="text-[9px] font-black text-blue-500 uppercase italic">AdScale Score: {ad.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-10">
                      <div className="text-center">
                        <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Volume Real</span>
                        <span className="text-xl font-black text-emerald-500 italic">{ad.adCount} Ativos</span>
                      </div>
                      <div className="text-center">
                        <span className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Status Rede</span>
                        <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase italic ${ad.status === AdStatus.SCALING ? 'bg-emerald-500/10 text-emerald-500' : 'bg-blue-500/10 text-blue-500'
                          }`}>
                          {ad.status}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => toggleFeatured(ad)}
                          className={`p-4 rounded-2xl transition-all ${ad.isFeatured
                            ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/30'
                            : 'bg-white text-slate-400 hover:text-slate-900 border border-slate-200'
                            }`}
                          title={ad.isFeatured ? "Remover da Home" : "Adicionar à Home"}
                        >
                          {ad.isFeatured ? <Eye size={20} /> : <EyeOff size={20} />}
                        </button>
                        <button onClick={() => setEditingAd(ad)} className="p-4 bg-white text-slate-400 hover:text-slate-900 rounded-2xl border border-slate-200 transition-all">
                          <Settings2 size={20} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* VIEW: TOPIC EXPLORER */}
          {activeDataView === 'topics' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-12 animate-in slide-in-from-right-8 duration-500">
              {/* Categories Grid - Mobile/Tablet list, Desktop sidebar */}
              <div className="lg:col-span-1 space-y-6">
                <div className="bg-white border border-slate-200 rounded-[32px] p-8 shadow-sm">
                  <h4 className="text-[12px] font-black uppercase italic text-slate-900 mb-8 flex items-center gap-3">
                    <ListFilter size={16} /> Segmentação Inteligente
                  </h4>
                  <div className="grid grid-cols-2 lg:grid-cols-1 gap-2">
                    <button
                      onClick={() => setSelectedNiche('all')}
                      className={`w-full text-left px-5 py-4 rounded-xl text-[10px] font-black uppercase italic transition-all flex justify-between items-center ${selectedNiche === 'all'
                        ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20'
                        : 'text-slate-400 hover:bg-slate-50'
                        }`}
                    >
                      <span>TODOS OS SINAIS</span>
                      <span className="opacity-40">{ads.length}</span>
                    </button>
                    {Object.values(Niche).map(n => (
                      <button
                        key={n}
                        onClick={() => setSelectedNiche(n)}
                        className={`w-full text-left px-5 py-4 rounded-xl text-[10px] font-black uppercase italic transition-all flex justify-between items-center ${selectedNiche === n
                          ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20'
                          : 'text-slate-400 hover:bg-slate-50'
                          }`}
                      >
                        <span className="truncate pr-2">{n}</span>
                        <span className="opacity-40">{nicheStats[n] || 0}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-[32px] p-8 text-white shadow-2xl relative overflow-hidden group">
                  <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-white/10 rounded-full blur-3xl group-hover:scale-150 transition-transform duration-700" />
                  <h5 className="text-xl font-black italic uppercase leading-none mb-3">Auditoria IA</h5>
                  <p className="text-[9px] font-bold uppercase tracking-widest opacity-80 mb-6">Analise a concorrência por nicho automaticamente.</p>
                  <button className="w-full bg-white text-indigo-900 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest italic shadow-xl">Processar Insights</button>
                </div>
              </div>

              {/* Results Container */}
              <div className="lg:col-span-3 bg-white border border-slate-200 rounded-[48px] p-10 shadow-sm">
                <div className="flex flex-col md:flex-row items-center justify-between mb-10 gap-6">
                  <div>
                    <h3 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">
                      Filtro: <span className="text-blue-500">{selectedNiche === 'all' ? 'Base de Dados' : selectedNiche}</span>
                    </h3>
                    <p className="text-[10px] font-black text-slate-500 uppercase italic tracking-widest">{filteredByTopic.length} Sinais Interceptados</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <SortAsc size={16} className="text-slate-700" />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest italic">Ordenado por Data</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-[700px] overflow-y-auto pr-4 custom-scrollbar">
                  {filteredByTopic.map(ad => (
                    <div key={ad.id} className="bg-slate-50 border border-slate-200 rounded-3xl p-5 flex items-center justify-between group hover:border-blue-500/30 transition-all">
                      <div className="flex items-center gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 bg-white rounded-xl overflow-hidden border border-slate-200">
                          <img src={ad.brandLogo} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div className="min-w-0">
                          <h4 className="text-[11px] font-black text-slate-900 uppercase italic truncate pr-2 leading-none mb-1.5">{ad.title}</h4>
                          <div className="flex items-center gap-3">
                            <span className="text-[9px] font-mono text-blue-500 leading-none">{ad.adCount} Ativos</span>
                            <div className="w-1 h-1 bg-slate-700 rounded-full" />
                            <span className={`text-[8px] font-black uppercase italic leading-none ${ad.status === AdStatus.SCALING ? 'text-emerald-500' : 'text-slate-500'}`}>{ad.status}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => setEditingAd(ad)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-900 transition-all"><Edit3 size={14} /></button>
                        <button
                          onClick={() => toggleFeatured(ad)}
                          className={`p-2.5 rounded-xl transition-all ${ad.isFeatured ? 'bg-blue-600 text-white' : 'bg-white border border-slate-200 text-slate-400 hover:text-slate-900'}`}
                        >
                          <Star size={14} fill={ad.isFeatured ? 'currentColor' : 'none'} />
                        </button>
                      </div>
                    </div>
                  ))}
                  {filteredByTopic.length === 0 && (
                    <div className="col-span-full py-32 text-center flex flex-col items-center gap-6 opacity-30">
                      <Database size={48} />
                      <span className="text-[11px] font-black uppercase tracking-[0.4em] italic">Nenhum sinal interceptado neste nicho</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* OTHER TABS (MEDIA, FINANCE, ETC) - MANTIDOS COMO ESTAVAM */}
      {activeTab === 'media' && (
        <div className="space-y-8 animate-in fade-in duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            <div
              onClick={() => fileInputRef.current?.click()}
              className="lg:col-span-1 bg-blue-600 hover:bg-blue-500 p-8 rounded-[32px] flex flex-col items-center justify-center gap-4 cursor-pointer transition-all shadow-xl group"
            >
              <input type="file" ref={fileInputRef} className="hidden" multiple onChange={handleFileUpload} />
              <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center text-white group-hover:scale-110 transition-transform">
                <Upload size={32} />
              </div>
              <div className="text-center">
                <span className="block text-xs font-black text-white uppercase italic">Subir Ativos</span>
                <span className="text-[10px] text-white/60 font-bold uppercase italic">Video/Imagem</span>
              </div>
            </div>

            <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {assets.filter(a => a.name.toLowerCase().includes(assetsSearch.toLowerCase())).map(asset => (
                <div key={asset.id} className="bg-white border border-slate-200 rounded-[32px] p-6 group shadow-sm">
                  <div className="aspect-video bg-black rounded-2xl overflow-hidden mb-4 relative">
                    {asset.type === 'video' ? <video src={asset.url} className="w-full h-full object-cover" /> : <img src={asset.url} className="w-full h-full object-cover" />}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button onClick={() => copyToClipboard(asset.url)} className="p-3 bg-white text-slate-900 rounded-xl hover:bg-blue-600 hover:text-white transition-all"><Copy size={18} /></button>
                      <button onClick={() => deleteAsset(asset.id)} className="p-3 bg-white text-rose-600 rounded-xl hover:bg-rose-600 hover:text-white transition-all"><Trash2 size={18} /></button>
                    </div>
                  </div>
                  <h4 className="text-[10px] font-black text-slate-900 uppercase italic truncate">{asset.name}</h4>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'finance' && (
        <div className="bg-white border border-slate-200 rounded-[48px] p-20 text-center animate-in zoom-in-95 duration-500 shadow-sm">
          <DollarSign size={48} className="mx-auto text-emerald-500 mb-6" />
          <h2 className="text-3xl font-black uppercase italic text-slate-900">Painel de Faturamento</h2>
          <p className="text-slate-500 mt-2 font-black uppercase text-[10px] tracking-widest italic">Gestão de MRR e assinaturas da rede.</p>
        </div>
      )}
    </div>
  );
};

export default Admin;
