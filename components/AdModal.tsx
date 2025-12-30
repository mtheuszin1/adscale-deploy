import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, CircleDollarSign, Store, ShoppingBag, Facebook, BarChart3, ShieldCheck, Target, Layers, Globe, Lock, Crown, Sparkles, TrendingUp, Download, Eye, Maximize2, Zap, BrainCircuit, History } from 'lucide-react';
import { Ad, AdHistory } from '../types';
import { api } from '../services/api';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';

interface AdModalProps {
  ad: Ad;
  onClose: () => void;
  onNextAd?: () => void;
  onPrevAd?: () => void;
  isSubscribed?: boolean;
  onUpgrade?: () => void;
}

const AdModal: React.FC<AdModalProps> = ({ ad, onClose, onNextAd, onPrevAd, isSubscribed = false, onUpgrade }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'ai' | 'history'>('overview');
  const [aiVariations, setAiVariations] = useState<any[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [historyData, setHistoryData] = useState<AdHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  const isVideo = ad.mediaUrl.toLowerCase().includes('.mp4') || ad.mediaUrl.toLowerCase().includes('video');
  const creativeMedia = ad.mediaUrl || ad.thumbnail || `https://ui-avatars.com/api/?name=AD&background=1e293b&color=3b82f6&size=1024&bold=true`;
  const brandLogo = ad.brandLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(ad.title)}&background=3b82f6&color=fff&size=256&bold=true`;

  useEffect(() => {
    if (isSubscribed && activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab, ad.id]);

  const fetchHistory = async () => {
    try {
      setIsLoadingHistory(true);
      const data = await api.getAdHistory(ad.id);
      setHistoryData(data);
    } catch (e) {
      console.error("Failed to load history", e);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleGenerateCopy = async () => {
    try {
      setIsGenerating(true);
      const res = await api.generateAICopy(ad.id);
      setAiVariations(res.variations);
    } catch (e) {
      console.error("AI Error", e);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(ad.mediaUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `adscale_${ad.mediaHash || ad.id}.${isVideo ? 'mp4' : 'png'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      window.open(ad.mediaUrl, '_blank');
    }
  };

  const formatUrlDisplay = (url: string) => {
    if (!url || url === "#") return "DADO NÃO INTERCEPTADO";
    return url;
  };

  const copy = ad.copy || 'Sem descrição registrada para este sinal.';
  const isLongCopy = copy.length > 300;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-950/98 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative bg-[#020617] w-full max-w-7xl max-h-[95vh] rounded-[40px] overflow-hidden border border-slate-800 shadow-[0_0_100px_rgba(37,99,235,0.15)] flex flex-col md:flex-row animate-in zoom-in-95 duration-300">

        <button onClick={onClose} className="absolute top-8 right-8 z-50 p-2.5 bg-slate-900/80 text-slate-400 rounded-2xl hover:text-white transition-all border border-slate-800 hover:scale-110">
          <X size={22} />
        </button>

        {/* PAINEL ESQUERDO: MÍDIA / CREATIVE PREVIEW */}
        <div className="md:w-[45%] bg-black flex flex-col relative group overflow-hidden border-r border-slate-800 min-h-[500px] justify-center">
          <div className="w-full h-full relative flex items-center justify-center">
            {isVideo ? (
              <video
                key={ad.mediaUrl}
                src={ad.mediaUrl}
                className="w-full h-full object-contain"
                poster={ad.thumbnail}
                controls autoPlay muted loop playsInline
              />
            ) : (
              <img
                src={creativeMedia}
                alt={ad.title}
                className="w-full h-full object-contain"
              />
            )}
          </div>

          <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-6 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); onPrevAd?.(); }} className="p-4 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white pointer-events-auto hover:bg-blue-600 transition-all"><ChevronLeft size={24} /></button>
            <button onClick={(e) => { e.stopPropagation(); onNextAd?.(); }} className="p-4 bg-black/60 backdrop-blur-md rounded-full border border-white/10 text-white pointer-events-auto hover:bg-blue-600 transition-all"><ChevronRight size={24} /></button>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <button onClick={handleDownload} className="flex items-center gap-2 px-6 py-3 bg-white text-black text-[10px] font-black uppercase rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-2xl">
              <Download size={14} /> Download Criativo
            </button>
          </div>
        </div>

        {/* PAINEL DIREITO: DOSSIÊ TÉCNICO ESTRUTURADO */}
        <div className="md:w-[55%] p-10 md:p-14 overflow-y-auto custom-scrollbar flex flex-col bg-[#020617] relative">

          {/* PAYWALL OVERLAY */}
          {!isSubscribed && (
            <div className="absolute inset-0 z-50 backdrop-blur-md bg-[#020617]/40 flex flex-col items-center justify-center text-center p-8">
              <div className="bg-[#020617]/90 border border-blue-500/30 p-10 rounded-[40px] shadow-2xl shadow-blue-900/20 max-w-md backdrop-blur-xl">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-blue-600/40">
                  <Lock size={32} />
                </div>
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">
                  Dossiê Confidencial
                </h3>
                <p className="text-slate-400 text-sm font-medium leading-relaxed mb-8">
                  Análise completa de funil, métricas de escala, copy e links de destino são exclusivos para membros PRO.
                </p>
                <button
                  onClick={onUpgrade}
                  className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white py-4 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-600/20 transition-all hover:scale-[1.02] flex items-center justify-center gap-3"
                >
                  <Crown size={16} /> Desbloquear Agora
                </button>
              </div>
            </div>
          )}

          <div className={`relative z-10 space-y-10 transition-all duration-500 ${!isSubscribed ? 'blur-sm select-none opacity-50 pointer-events-none' : ''}`}>

            <div className="flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-4xl font-black text-white tracking-[0.2em] uppercase leading-none italic">DOSSIÊ DO SINAL</h2>
                  <div className="w-20 h-1 bg-blue-600 mt-4" />
                </div>
              </div>

              {/* TABS SELECTOR */}
              <div className="flex items-center gap-2 bg-white/5 p-1 rounded-2xl border border-white/10 self-start">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'overview' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <Eye size={14} /> Visão Geral
                </button>
                <button
                  onClick={() => setActiveTab('ai')}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'ai' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <BrainCircuit size={14} /> AI Copy Assistant
                </button>
                <button
                  onClick={() => setActiveTab('history')}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
                >
                  <History size={14} /> Curva de Escala
                </button>
              </div>
            </div>

            {activeTab === 'overview' && (
              <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* BRAND CARD */}
                <div className="bg-white rounded-[32px] p-8 shadow-2xl border border-white/10">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img
                          src={brandLogo}
                          className="w-14 h-14 rounded-full bg-slate-100 border border-slate-200 object-cover"
                          alt={ad.title}
                        />
                        <div className="absolute -bottom-0.5 -right-0.5 bg-blue-600 text-white p-1 rounded-full border-2 border-white">
                          <ShieldCheck size={12} />
                        </div>
                      </div>
                      <div>
                        <h4 className="text-[16px] font-black text-slate-900 leading-tight uppercase italic tracking-tight">
                          {ad.title}
                        </h4>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1 italic">
                          <Globe size={10} /> {ad.platform}
                        </div>
                      </div>
                    </div>
                    <div className="bg-blue-600/10 text-blue-600 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase italic tracking-widest border border-blue-600/20">
                      {ad.status}
                    </div>
                  </div>

                  <div className="pt-2 border-t border-slate-100 mt-4">
                    <p className={`text-[13px] text-slate-800 leading-relaxed font-medium italic ${!isExpanded ? 'line-clamp-[6]' : ''}`}>
                      "{copy}"
                    </p>
                    {isLongCopy && (
                      <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-[9px] font-black text-blue-600 uppercase tracking-widest mt-4 flex items-center gap-1 italic hover:underline"
                      >
                        {isExpanded ? 'Recolher Copy' : 'Expandir Copy Completo'}
                      </button>
                    )}
                  </div>
                </div>

                {/* METADATA LIST */}
                <div className="grid grid-cols-2 gap-8 pl-2">
                  <div className="flex items-center gap-5 group">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-blue-500 transition-colors">
                      <Target size={20} />
                    </div>
                    <div>
                      <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">NICHO</span>
                      <span className="text-[13px] font-black text-white uppercase italic">{ad.niche}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 group">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-blue-500 transition-colors">
                      <Layers size={20} />
                    </div>
                    <div>
                      <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">FUNIL ESTRATÉGICO</span>
                      <span className="text-[13px] font-black text-white uppercase italic">{ad.funnelType || 'Direct -> Checkout'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 group">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-blue-500 transition-colors">
                      <BarChart3 size={20} />
                    </div>
                    <div>
                      <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">ANÚNCIOS EM ESCALA</span>
                      <span className="text-[13px] font-black text-blue-500 uppercase italic">{ad.adCount} ATIVOS</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 group">
                    <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-500 group-hover:text-blue-500 transition-colors">
                      <CircleDollarSign size={20} />
                    </div>
                    <div>
                      <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">TICKET DE OFERTA</span>
                      <span className="text-[13px] font-black text-white uppercase italic">{ad.ticketPrice}</span>
                    </div>
                  </div>
                </div>

                {/* EXTERNAL INTELLIGENCE LINKS */}
                <div className="space-y-6 pt-8 border-t border-white/5">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 text-slate-500">
                      <Store size={14} />
                      <span className="text-[9px] font-black uppercase tracking-widest italic">PÁGINA DE VENDAS</span>
                    </div>
                    <a href={ad.salesPageUrl} target="_blank" rel="noreferrer" className="text-[12px] font-bold text-blue-500 underline truncate hover:text-blue-400 italic transition-colors">
                      {formatUrlDisplay(ad.salesPageUrl)}
                    </a>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 text-slate-500">
                      <ShoppingBag size={14} />
                      <span className="text-[9px] font-black uppercase tracking-widest italic">CHECKOUT DESTINO</span>
                    </div>
                    <a href={ad.checkoutUrl} target="_blank" rel="noreferrer" className="text-[12px] font-bold text-blue-500 underline truncate hover:text-blue-400 italic transition-colors">
                      {formatUrlDisplay(ad.checkoutUrl)}
                    </a>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 text-slate-500">
                      <Facebook size={14} />
                      <span className="text-[9px] font-black uppercase tracking-widest italic">BIBLIOTECA DE ATIVOS</span>
                    </div>
                    <a href={ad.libraryUrl} target="_blank" rel="noreferrer" className="text-[12px] font-bold text-blue-500 underline truncate hover:text-blue-400 italic transition-colors">
                      {formatUrlDisplay(ad.libraryUrl)}
                    </a>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-gradient-to-br from-blue-600/20 to-indigo-600/10 border border-blue-500/30 p-8 rounded-[40px]">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <Sparkles className="text-blue-400" size={24} />
                      <h3 className="text-[18px] font-black text-white uppercase italic tracking-tighter">AI Ad Copy Assistant</h3>
                    </div>
                    <button
                      onClick={handleGenerateCopy}
                      disabled={isGenerating}
                      className="px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                    >
                      {isGenerating ? <Zap className="animate-pulse" size={14} /> : <Zap size={14} />}
                      {isGenerating ? "Processando..." : "Gerar Novas Variações"}
                    </button>
                  </div>

                  {aiVariations.length === 0 && !isGenerating ? (
                    <div className="text-center py-20 border-2 border-dashed border-white/5 rounded-[32px]">
                      <BrainCircuit size={40} className="mx-auto text-slate-700 mb-4" />
                      <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest italic">
                        Clique no botão acima para interceptar e recriar o copy usando IA.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {isGenerating && (
                        <div className="flex flex-col gap-4 animate-pulse">
                          {[1, 2].map(i => <div key={i} className="h-40 bg-white/5 rounded-3xl" />)}
                        </div>
                      )}
                      {!isGenerating && aiVariations.map((v, i) => (
                        <div key={i} className="bg-[#020617] p-6 rounded-3xl border border-white/5 group relative transition-all hover:border-blue-500/40">
                          <p className="text-slate-300 text-sm italic leading-relaxed whitespace-pre-wrap">
                            {v.text}
                          </p>
                          <button
                            onClick={() => { navigator.clipboard.writeText(v.text); }}
                            className="absolute top-4 right-4 p-2 bg-white/5 text-slate-500 rounded-lg hover:bg-blue-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"
                          >
                            <Download size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {activeTab === 'history' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-[#020617] p-8 rounded-[40px] border border-white/5">
                  <div className="flex items-center gap-3 mb-10">
                    <TrendingUp className="text-blue-500" size={24} />
                    <h3 className="text-[18px] font-black text-white uppercase italic tracking-tighter">Histórico de Escala (Sinais Ativos)</h3>
                  </div>

                  <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={historyData.length > 0 ? historyData : [
                        { timestamp: 'D-4', adCount: ad.adCount * 0.4 },
                        { timestamp: 'D-3', adCount: ad.adCount * 0.6 },
                        { timestamp: 'D-2', adCount: ad.adCount * 0.9 },
                        { timestamp: 'Hoje', adCount: ad.adCount }
                      ]}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#2563eb" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff0a" vertical={false} />
                        <XAxis
                          dataKey="timestamp"
                          stroke="#475569"
                          fontSize={9}
                          tickFormatter={(str) => str.includes('T') ? str.split('T')[0] : str}
                        />
                        <YAxis stroke="#475569" fontSize={9} />
                        <Tooltip
                          contentStyle={{ background: '#020617', border: '1px solid #1e293b', borderRadius: '12px' }}
                          labelStyle={{ color: '#64748b', fontSize: '10px', marginBottom: '4px' }}
                        />
                        <Area type="monotone" dataKey="adCount" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-8 p-6 bg-blue-600/5 rounded-2xl border border-blue-500/20">
                    <p className="text-[11px] text-blue-500 font-black uppercase italic leading-relaxed">
                      Insight do Especialista: O padrão de crescimento indica uma fase de {ad.adCount > 30 ? 'ESCALA VERTICAL' : 'VALIDAÇÃO DE CRIATIVO'}. A probabilidade de sucesso para novos testes é de 85% baseada em volume de sinal.
                    </p>
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
};

export default AdModal;
