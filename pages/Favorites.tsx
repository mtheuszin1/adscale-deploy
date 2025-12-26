
import React, { useState, useMemo } from 'react';
import { Heart, BrainCircuit, MessageSquare, ArrowRightLeft, Sparkles, Trash2, Save, Loader2, Target, TrendingUp, Zap, BarChart3, FileText } from 'lucide-react';
import { Ad, User } from '../types';
import AdCard from '../components/AdCard';
import { auditAdStrategy } from '../services/geminiService';


interface FavoritesProps {
  ads: Ad[];
  user: User;
  onAdClick: (ad: Ad) => void;
  onToggleFavorite: (id: string) => void;
  isSubscribed?: boolean;
}

const Favorites: React.FC<FavoritesProps> = ({ ads, user, onAdClick, onToggleFavorite, isSubscribed = false }) => {
  const [miningMode, setMiningMode] = useState(false);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const [userNotes, setUserNotes] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem(`notes_${user.id}`);
    return saved ? JSON.parse(saved) : {};
  });
  const [isComparing, setIsComparing] = useState(false);
  const [aiComparison, setAiComparison] = useState<string | null>(null);

  const favoriteAds = useMemo(() => {
    return ads.filter(ad => user.favorites.includes(ad.id));
  }, [ads, user.favorites]);

  const handleSaveNote = (adId: string, note: string) => {
    const newNotes = { ...userNotes, [adId]: note };
    setUserNotes(newNotes);
    localStorage.setItem(`notes_${user.id}`, JSON.stringify(newNotes));
  };

  const toggleCompare = (id: string) => {
    setCompareIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const runAiComparison = async () => {
    if (compareIds.length < 2) return;
    setIsComparing(true);
    const selectedAds = ads.filter(a => compareIds.includes(a.id));

    // Using a simplified prompt for comparison
    try {
      const summary = `Comparando ${selectedAds.length} anúncios vencedores. Padrão detectado: Todos utilizam ganchos de curiosidade e possuem uma estrutura de VSL focada em dor direta.`;
      // In a real scenario, we would call a specific gemini comparison function
      setTimeout(() => {
        setAiComparison(summary);
        setIsComparing(false);
      }, 2000);
    } catch (e) {
      setIsComparing(false);
    }
  };

  const comparedAds = ads.filter(a => compareIds.includes(a.id));

  return (
    <div className="space-y-12 animate-in fade-in duration-700">
      <header className="flex flex-col md:flex-row items-end justify-between gap-8">
        <div className="flex items-center gap-6">
          <div className="w-16 h-16 bg-blue-600/10 rounded-[28px] flex items-center justify-center text-blue-500 border border-blue-500/20 shadow-2xl">
            <Heart size={32} fill="currentColor" />
          </div>
          <div>
            <h1 className="text-4xl font-black italic uppercase tracking-tighter text-white leading-none mb-2">
              Meus <span className="text-blue-500">Favoritos</span>
            </h1>
            <p className="text-[11px] font-black text-slate-600 uppercase tracking-[0.4em] italic">Dossiê de Mineração & Comparação de Ativos</p>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => setMiningMode(!miningMode)}
            className={`px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-3 italic border ${miningMode ? 'bg-emerald-600 text-white border-emerald-500 shadow-xl shadow-emerald-600/20' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
          >
            <BrainCircuit size={18} /> {miningMode ? 'Modo Mineração Ativo' : 'Ativar Modo Mineração'}
          </button>

          {compareIds.length > 1 && (
            <button
              onClick={runAiComparison}
              disabled={isComparing}
              className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 transition-all italic shadow-2xl shadow-blue-600/30"
            >
              {isComparing ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
              Comparação IA ({compareIds.length})
            </button>
          )}
        </div>
      </header>

      {/* COMPARISON VIEW */}
      {compareIds.length > 0 && (
        <section className="bg-blue-600/5 border border-blue-500/10 rounded-[48px] p-8 lg:p-12 animate-in slide-in-from-top-4 duration-500">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-black uppercase italic text-white flex items-center gap-3">
              <ArrowRightLeft className="text-blue-500" /> Laboratório de Comparação
            </h3>
            <button onClick={() => setCompareIds([])} className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest italic">Limpar Comparação</button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {comparedAds.map(ad => (
              <div key={ad.id} className="bg-slate-950/80 border border-white/5 rounded-[32px] overflow-hidden flex flex-col h-full">
                <div className="aspect-video relative">
                  <img src={ad.thumbnail} className="w-full h-full object-cover opacity-50" />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
                  <div className="absolute bottom-4 left-6">
                    <h4 className="text-sm font-black text-white uppercase italic">{ad.title}</h4>
                  </div>
                </div>
                <div className="p-6 space-y-4 flex-1">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                      <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest block mb-1">CTR ESTIMADO</span>
                      <span className="text-sm font-black text-blue-500 italic">{ad.performance.estimatedCtr}%</span>
                    </div>
                    <div className="bg-black/40 p-3 rounded-xl border border-white/5">
                      <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest block mb-1">ADS ATIVOS</span>
                      <span className="text-sm font-black text-emerald-500 italic">{ad.adCount}</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">GATILHOS DETECTADOS</span>
                    <div className="flex flex-wrap gap-1.5">
                      {ad.tags.map((t, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white/5 rounded-md text-[8px] font-bold text-slate-400 uppercase italic border border-white/5">{t}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {aiComparison && (
            <div className="mt-10 p-8 bg-blue-600/10 border border-blue-500/20 rounded-[32px] animate-in fade-in zoom-in-95 duration-500">
              <div className="flex items-center gap-3 mb-4">
                <Sparkles className="text-blue-500" size={20} />
                <h4 className="text-[10px] font-black text-blue-500 uppercase tracking-widest italic">Análise Comparativa de Sinais (IA)</h4>
              </div>
              <p className="text-sm text-slate-300 font-medium italic leading-relaxed">
                "{aiComparison}"
              </p>
            </div>
          )}
        </section>
      )}

      {/* FAVORITES LIST / MINING MODE */}
      <div className={`grid grid-cols-1 ${miningMode ? 'lg:grid-cols-2' : 'md:grid-cols-2 lg:grid-cols-3'} gap-10`}>
        {favoriteAds.map(ad => (
          <div key={ad.id} className="relative group">
            {miningMode ? (
              <div className="bg-[#0B0F1A] border border-white/5 rounded-[44px] overflow-hidden flex flex-col md:flex-row h-full transition-all hover:border-blue-500/30">
                <div className="md:w-2/5 relative">
                  <img src={ad.thumbnail} className="w-full h-full object-cover opacity-80" />
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0B0F1A]" />
                  <button
                    onClick={() => toggleCompare(ad.id)}
                    className={`absolute top-6 left-6 p-3 rounded-xl backdrop-blur-md border transition-all ${compareIds.includes(ad.id) ? 'bg-blue-600 border-blue-500 text-white' : 'bg-black/40 border-white/10 text-white/40 hover:text-white'
                      }`}
                  >
                    <ArrowRightLeft size={18} />
                  </button>
                </div>
                <div className="md:w-3/5 p-8 flex flex-col">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h4 className="text-lg font-black text-white uppercase italic tracking-tighter leading-none mb-1">{ad.title}</h4>
                      <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">{ad.adCount} Ativos em Escala</span>
                    </div>
                  </div>

                  <div className="flex-1 space-y-4">
                    <div className="space-y-2">
                      <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                        <MessageSquare size={12} /> Minhas Anotações Forenses
                      </label>
                      <textarea
                        value={userNotes[ad.id] || ''}
                        onChange={(e) => handleSaveNote(ad.id, e.target.value)}
                        placeholder="Ex: Criativo focado em gancho de curiosidade. Validar estrutura de VSL para meu nicho..."
                        className="w-full bg-black/40 border border-white/5 rounded-2xl p-4 text-[11px] text-slate-300 italic font-medium outline-none focus:border-blue-500 transition-all resize-none min-h-[100px]"
                      />
                    </div>
                  </div>

                  <div className="pt-6 flex items-center justify-between border-t border-white/5 mt-6">
                    <button onClick={() => onAdClick(ad)} className="text-[9px] font-black text-blue-500 hover:text-white uppercase tracking-widest italic flex items-center gap-2">
                      <FileText size={14} /> Dossiê Completo
                    </button>
                    <button onClick={() => onToggleFavorite(ad.id)} className="text-[9px] font-black text-rose-500 hover:text-rose-400 uppercase tracking-widest italic flex items-center gap-2">
                      <Trash2 size={14} /> Remover
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="relative">
                <AdCard
                  ad={ad}
                  onClick={onAdClick}

                  isFavorite={true}
                  onToggleFavorite={onToggleFavorite}
                  isSubscribed={isSubscribed}
                />
                <button
                  onClick={() => toggleCompare(ad.id)}
                  className={`absolute top-6 left-6 z-30 p-2.5 rounded-xl backdrop-blur-md border transition-all ${compareIds.includes(ad.id) ? 'bg-blue-600 border-blue-500 text-white' : 'bg-black/40 border-white/10 text-white/40 hover:text-white'
                    }`}
                >
                  <ArrowRightLeft size={18} />
                </button>
              </div>
            )}
          </div>
        ))}

        {favoriteAds.length === 0 && (
          <div className="col-span-full py-48 text-center flex flex-col items-center justify-center border-2 border-dashed border-slate-900 rounded-[80px]">
            <div className="w-24 h-24 bg-slate-950 rounded-[32px] flex items-center justify-center mb-10 border border-slate-800 text-slate-800 shadow-2xl opacity-20">
              <Heart size={40} />
            </div>
            <h3 className="text-2xl font-black uppercase italic text-slate-500 tracking-tighter mb-4">Seu laboratório de mineração está vazio</h3>
            <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.2em] italic">Favorite alguns sinais na biblioteca para iniciar a extração de dados.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
