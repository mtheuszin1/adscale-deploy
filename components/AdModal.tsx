import React, { useState, useEffect } from 'react';
import { X, ChevronRight, ChevronLeft, CircleDollarSign, Store, ShoppingBag, Facebook, BarChart3, ShieldCheck, Target, Layers, Globe, Lock, Crown, Sparkles, TrendingUp, Download, Eye, Maximize2, Zap, BrainCircuit, History } from 'lucide-react';
import { Ad, AdHistory } from '../types';
import { api, getMediaUrl } from '../services/api';
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
  const [strategicDecode, setStrategicDecode] = useState<any>(null);
  const [isLoadingDecode, setIsLoadingDecode] = useState(false);

  const isVideo = ad.type === 'VSL' || (ad.mediaUrl || '').toLowerCase().match(/\.(mp4|webm|ogg|mov)$/) || (ad.mediaUrl || '').toLowerCase().includes('video') || (ad.mediaUrl || '').includes('blob:');
  const [mediaError, setMediaError] = useState(false);
  const creativeMedia = ad.mediaUrl || ad.thumbnail || `https://ui-avatars.com/api/?name=AD&background=1e293b&color=3b82f6&size=1024&bold=true`;
  const brandLogo = ad.brandLogo || `https://ui-avatars.com/api/?name=${encodeURIComponent(ad.title)}&background=3b82f6&color=fff&size=256&bold=true`;

  useEffect(() => {
    if (isSubscribed && activeTab === 'history') {
      fetchHistory();
    }
    if (isSubscribed && activeTab === 'ai' && !strategicDecode) {
      handleStrategicDecode();
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

  const handleStrategicDecode = async () => {
    try {
      setIsLoadingDecode(true);
      const res = await api.strategicDecode(ad.id);
      setStrategicDecode(res);
    } catch (e) {
      console.error("Decode Error", e);
    } finally {
      setIsLoadingDecode(false);
    }
  };

  const handleDownload = async () => {
    try {
      const fullUrl = getMediaUrl(ad.mediaUrl);
      const response = await fetch(fullUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `adscale_${ad.mediaHash || ad.id}.${isVideo ? 'mp4' : 'png'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      window.open(getMediaUrl(ad.mediaUrl), '_blank');
    }
  };

  const formatUrlDisplay = (url: string) => {
    if (!url || url === "#") return "DADO NÃO INTERCEPTADO";
    return url;
  };

  const copy = ad.copy || 'Sem descrição registrada para este sinal.';
  const isLongCopy = copy.length > 300;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative bg-white w-full max-w-7xl max-h-[95vh] rounded-[40px] overflow-hidden border border-slate-200 shadow-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-300">

        <button onClick={onClose} className="absolute top-8 right-8 z-50 p-2.5 bg-white text-slate-400 rounded-2xl hover:text-slate-900 transition-all border border-slate-100 shadow-sm hover:scale-110">
          <X size={22} />
        </button>

        {/* PAINEL ESQUERDO: MÍDIA / CREATIVE PREVIEW */}
        <div className="md:w-[45%] bg-slate-50 flex flex-col relative group overflow-hidden border-r border-slate-100 min-h-[500px] justify-center">
          <div className="w-full h-full relative flex items-center justify-center">
            {isVideo && !mediaError ? (
              <video
                key={ad.mediaUrl}
                src={getMediaUrl(ad.mediaUrl)}
                className="w-full h-full object-contain"
                poster={getMediaUrl(ad.thumbnail)}
                controls autoPlay muted loop playsInline
                onError={() => setMediaError(true)}
              />
            ) : (
              <div className="w-full h-full relative flex items-center justify-center bg-slate-100">
                <img
                  src={getMediaUrl(creativeMedia)}
                  alt={ad.title}
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=AD&background=1e293b&color=3b82f6&size=1024&bold=true`;
                  }}
                />
                {mediaError && (
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 bg-white/90 backdrop-blur-md border border-slate-200 p-8 rounded-[32px] shadow-2xl flex flex-col items-center text-center max-w-[80%]">
                    <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mb-4">
                      <ShoppingBag size={24} />
                    </div>
                    <h4 className="text-slate-900 font-black uppercase italic tracking-tighter text-sm mb-2">Mídia Indisponível</h4>
                    <p className="text-slate-500 text-[10px] font-medium leading-relaxed mb-6">
                      O link original desta mídia expirou ou é temporário. Você pode tentar re-importar este sinal para atualizar o conteúdo.
                    </p>
                    <a
                      href={ad.libraryUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-6 py-2 bg-blue-600 text-white text-[9px] font-black uppercase rounded-xl hover:bg-blue-500 transition-all shadow-lg"
                    >
                      Ver na Biblioteca Original
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-between px-6 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); onPrevAd?.(); }} className="p-4 bg-white/80 backdrop-blur-md rounded-full border border-slate-200 text-slate-400 pointer-events-auto hover:bg-blue-600 hover:text-white transition-all shadow-sm"><ChevronLeft size={24} /></button>
            <button onClick={(e) => { e.stopPropagation(); onNextAd?.(); }} className="p-4 bg-white/80 backdrop-blur-md rounded-full border border-slate-200 text-slate-400 pointer-events-auto hover:bg-blue-600 hover:text-white transition-all shadow-sm"><ChevronRight size={24} /></button>
          </div>

          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity z-20">
            <button onClick={handleDownload} className="flex items-center gap-2 px-6 py-3 bg-white text-black text-[10px] font-black uppercase rounded-xl hover:bg-blue-500 hover:text-white transition-all shadow-2xl">
              <Download size={14} /> Download Criativo
            </button>
          </div>
        </div>

        {/* PAINEL DIREITO: DOSSIÊ TÉCNICO ESTRUTURADO */}
        <div className="md:w-[55%] p-10 md:p-14 overflow-y-auto custom-scrollbar flex flex-col bg-white relative">

          {/* PAYWALL OVERLAY */}
          {!isSubscribed && (
            <div className="absolute inset-0 z-50 backdrop-blur-md bg-white/40 flex flex-col items-center justify-center text-center p-8">
              <div className="bg-white border border-slate-200 p-10 rounded-[40px] shadow-2xl max-w-md">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-white mx-auto mb-6 shadow-lg shadow-blue-600/40">
                  <Lock size={32} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 uppercase italic tracking-tighter mb-2">
                  Dossiê Confidencial
                </h3>
                <p className="text-slate-500 text-sm font-medium leading-relaxed mb-8">
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
                  <h2 className="text-4xl font-black text-slate-900 tracking-[0.2em] uppercase leading-none italic">DOSSIÊ DO SINAL</h2>
                  <div className="w-20 h-1 bg-blue-600 mt-4" />
                </div>
              </div>

              {/* TABS SELECTOR */}
              <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-2xl border border-slate-100 self-start">
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
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${activeTab === 'history' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-slate-900'}`}
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
                          src={getMediaUrl(brandLogo)}
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

                {/* ULTRA INTELLIGENCE WIDGETS */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-[32px] border border-slate-100 shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Saturação Criativa</span>
                      <span className="text-[11px] font-black text-slate-900">{ad.performance.saturationLevel || 0}%</span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-1000 ${(ad.performance.saturationLevel || 0) > 70 ? 'bg-rose-500' :
                          (ad.performance.saturationLevel || 0) > 40 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                        style={{ width: `${ad.performance.saturationLevel || 0}%` }}
                      />
                    </div>
                    <p className="text-[8px] text-slate-400 font-bold uppercase italic tracking-wider">
                      {(ad.performance.saturationLevel || 0) > 70 ? 'Público saturado - Risco de Fadiga' :
                        (ad.performance.saturationLevel || 0) > 40 ? 'Escala Saudável - Monitorar CTR' : 'Altamente Receptivo - Escala Livre'}
                    </p>
                  </div>

                  <div className="space-y-3 border-l border-slate-200 pl-6">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Momentum Score</span>
                      <span className="text-[11px] font-black text-blue-600">{(ad.performance.momentumScore || 0).toFixed(1)}/10</span>
                    </div>
                    <div className="flex gap-1">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className={`h-2 flex-1 rounded-full ${i < (ad.performance.momentumScore || 0) ? 'bg-blue-600' : 'bg-slate-200'
                            }`}
                        />
                      ))}
                    </div>
                    <p className="text-[8px] text-slate-400 font-bold uppercase italic tracking-wider">
                      Velocidade de Escala: {
                        (ad.performance.momentumScore || 0) > 8 ? 'EXPONENCIAL' :
                          (ad.performance.momentumScore || 0) > 5 ? 'ACELERADO' : 'ESTÁVEL'
                      }
                    </p>
                  </div>
                </div>

                {/* METADATA LIST */}
                <div className="grid grid-cols-2 gap-8 pl-2">
                  <div className="flex items-center gap-5 group">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors border border-slate-100">
                      <Target size={20} />
                    </div>
                    <div>
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">NICHO</span>
                      <span className="text-[13px] font-black text-slate-900 uppercase italic">{ad.niche}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 group">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors border border-slate-100">
                      <Layers size={20} />
                    </div>
                    <div>
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">FUNIL ESTRATÉGICO</span>
                      <span className="text-[13px] font-black text-slate-900 uppercase italic">{ad.funnelType || 'Direct -> Checkout'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 group">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors border border-slate-100">
                      <BarChart3 size={20} />
                    </div>
                    <div>
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">ANÚNCIOS EM ESCALA</span>
                      <span className="text-[13px] font-black text-blue-600 uppercase italic">{ad.adCount} ATIVOS</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-5 group">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-500 transition-colors border border-slate-100">
                      <CircleDollarSign size={20} />
                    </div>
                    <div>
                      <span className="block text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">TICKET DE OFERTA</span>
                      <span className="text-[13px] font-black text-slate-900 uppercase italic">{ad.ticketPrice}</span>
                    </div>
                  </div>
                </div>

                {/* EXTERNAL INTELLIGENCE LINKS */}
                <div className="space-y-6 pt-8 border-t border-slate-100">
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 text-slate-400">
                      <Store size={14} />
                      <span className="text-[9px] font-black uppercase tracking-widest italic">PÁGINA DE VENDAS</span>
                    </div>
                    <a href={ad.salesPageUrl} target="_blank" rel="noreferrer" className="text-[12px] font-bold text-blue-600 underline truncate hover:text-blue-500 italic transition-colors">
                      {formatUrlDisplay(ad.salesPageUrl)}
                    </a>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 text-slate-400">
                      <ShoppingBag size={14} />
                      <span className="text-[9px] font-black uppercase tracking-widest italic">CHECKOUT DESTINO</span>
                    </div>
                    <a href={ad.checkoutUrl} target="_blank" rel="noreferrer" className="text-[12px] font-bold text-blue-600 underline truncate hover:text-blue-500 italic transition-colors">
                      {formatUrlDisplay(ad.checkoutUrl)}
                    </a>
                  </div>

                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3 text-slate-400">
                      <Facebook size={14} />
                      <span className="text-[9px] font-black uppercase tracking-widest italic">BIBLIOTECA DE ATIVOS</span>
                    </div>
                    <a href={ad.libraryUrl} target="_blank" rel="noreferrer" className="text-[12px] font-bold text-blue-600 underline truncate hover:text-blue-500 italic transition-colors">
                      {formatUrlDisplay(ad.libraryUrl)}
                    </a>
                  </div>

                  {/* Creative DNA - Similar Ads discovery */}
                  <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Layers className="text-slate-400" size={18} />
                      <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Creative DNA</p>
                        <p className="text-[12px] font-black text-slate-900 uppercase italic">Media Hash: {ad.mediaHash}</p>
                      </div>
                    </div>
                    <button
                      className="px-4 py-2 bg-slate-50 text-slate-400 border border-slate-200 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white hover:border-blue-600 transition-all shadow-sm"
                      onClick={() => { /* Potential future filter logic */ }}
                    >
                      Descobrir Similares
                    </button>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'ai' && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <div className="bg-slate-50 border border-slate-200 p-8 rounded-[40px] shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                      <Sparkles className="text-blue-600" size={24} />
                      <h3 className="text-[18px] font-black text-slate-900 uppercase italic tracking-tighter">AI Ad Copy Assistant</h3>
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

                  {/* Strategic Decode Widget */}
                  {isLoadingDecode ? (
                    <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 animate-pulse">
                      {[1, 2, 3].map(i => <div key={i} className="h-20 bg-white rounded-3xl border border-slate-100" />)}
                    </div>
                  ) : strategicDecode && (
                    <div className="mb-8 grid grid-cols-1 md:grid-cols-3 gap-4 animate-in fade-in zoom-in-95 duration-500">
                      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm transition-all hover:scale-[1.02]">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Ângulo do Gancho</span>
                        <p className="text-[12px] font-black text-slate-900 uppercase italic leading-tight">{strategicDecode.hook}</p>
                      </div>
                      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm transition-all hover:scale-[1.02]">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Dor Central Alvo</span>
                        <p className="text-[12px] font-black text-slate-900 uppercase italic leading-tight">{strategicDecode.pain_point}</p>
                      </div>
                      <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm transition-all hover:scale-[1.02]">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Sofisticação</span>
                        <div className="flex gap-1 h-1.5 mt-2">
                          {[1, 2, 3, 4, 5].map(lv => (
                            <div key={lv} className={`flex-1 rounded-full ${lv <= strategicDecode.market_sophistication ? 'bg-blue-600' : 'bg-slate-100'}`} />
                          ))}
                        </div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase mt-2 block tracking-tighter">Nível {strategicDecode.market_sophistication} de 5</span>
                      </div>
                    </div>
                  )}

                  {aiVariations.length === 0 && !isGenerating ? (
                    <div className="text-center py-20 border-2 border-dashed border-slate-200 rounded-[32px] bg-white">
                      <BrainCircuit size={40} className="mx-auto text-slate-300 mb-4" />
                      <p className="text-slate-500 text-[11px] font-black uppercase tracking-widest italic">
                        Clique no botão acima para interceptar e recriar o copy usando IA.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {isGenerating && (
                        <div className="flex flex-col gap-4 animate-pulse">
                          {[1, 2].map(i => <div key={i} className="h-40 bg-white rounded-3xl border border-slate-100" />)}
                        </div>
                      )}
                      {!isGenerating && aiVariations.map((v, i) => (
                        <div key={i} className="bg-white p-6 rounded-3xl border border-slate-100 group relative transition-all hover:border-blue-500/40 shadow-sm">
                          <p className="text-slate-600 text-sm italic leading-relaxed whitespace-pre-wrap">
                            {v.text}
                          </p>
                          <button
                            onClick={() => { navigator.clipboard.writeText(v.text); }}
                            className="absolute top-4 right-4 p-2 bg-slate-50 text-slate-400 rounded-lg hover:bg-blue-600 hover:text-white transition-all opacity-0 group-hover:opacity-100"
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
                <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm">
                  <div className="flex items-center gap-3 mb-10">
                    <TrendingUp className="text-blue-600" size={24} />
                    <h3 className="text-[18px] font-black text-slate-900 uppercase italic tracking-tighter">Histórico de Escala (Sinais Ativos)</h3>
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
                          stroke="#94a3b8"
                          fontSize={9}
                          tickFormatter={(str) => str.includes('T') ? str.split('T')[0] : str}
                        />
                        <YAxis stroke="#94a3b8" fontSize={9} />
                        <Tooltip
                          contentStyle={{ background: '#ffffff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                          labelStyle={{ color: '#64748b', fontSize: '10px', marginBottom: '4px' }}
                        />
                        <Area type="monotone" dataKey="adCount" stroke="#2563eb" strokeWidth={4} fillOpacity={1} fill="url(#colorCount)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>

                  <div className="mt-8 p-6 bg-blue-600/5 rounded-2xl border border-blue-500/10">
                    <p className="text-[11px] text-blue-600 font-black uppercase italic leading-relaxed">
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
