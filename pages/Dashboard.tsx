
import React, { useState, useEffect, useMemo } from 'react';
// Fixed import source from 'lucide-center' to 'lucide-react'
import { TrendingUp, Globe, Cpu, Layers, Loader2, ChevronRight, Target, Anchor, LineChart, Trophy, Zap, ShieldCheck, BrainCircuit, Star, Headphones, Search, Database, Rocket, BarChart3, Fingerprint } from 'lucide-react';
import { Ad, Niche } from '../types';


interface DashboardProps {
  ads: Ad[];
  onAdClick: (ad: Ad) => void;
  onNavigate: (page: string) => void;
  isSubscribed?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ ads, onAdClick, onNavigate, isSubscribed = false }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  // Lógica de Curadoria: Prioriza marcados pelo Admin, depois os com maior volume
  const featuredAds = useMemo(() => {
    return [...ads]
      .filter(ad => ad.isVisible !== false) // Respeita visibilidade global
      .sort((a, b) => {
        // 1. Prioridade para isFeatured
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;

        // 2. Prioridade por displayOrder se ambos forem featured
        if (a.isFeatured && b.isFeatured) {
          return (a.displayOrder || 0) - (b.displayOrder || 0);
        }

        // 3. Fallback por volume de anúncios ativos
        return b.adCount - a.adCount;
      })
      .slice(0, 10);
  }, [ads]);

  const currentAd = featuredAds[activeIndex];

  useEffect(() => {
    if (featuredAds.length <= 1) return;

    const interval = setInterval(() => {
      setIsExiting(true);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % featuredAds.length);
        setIsExiting(false);
      }, 400);
    }, 4000); // Aumentado um pouco para melhor leitura

    return () => clearInterval(interval);
  }, [featuredAds]);

  const isVideo = currentAd?.mediaUrl?.toLowerCase().includes('.mp4');
  const creativeMedia = currentAd?.mediaUrl || currentAd?.thumbnail || `https://ui-avatars.com/api/?name=AD&background=1e293b&color=3b82f6&size=1024&bold=true`;

  const eliteFeatures = [
    {
      title: "RADAR DE ESCALA REAL",
      desc: "Interceptamos criativos que escalam 10x em 24h. O leilão avisa quem está ganhando o jogo antes de todo o mercado.",
      icon: <Globe size={32} />,
      color: "text-blue-500",
      bg: "bg-blue-500/5",
      border: "border-blue-500/10"
    },
    {
      title: "ENGENHARIA DE LUCRO",
      desc: "Desconstruímos a estrutura de ganchos e gatilhos que forçam a venda. Pare de testar e comece a replicar padrões lucrativos.",
      icon: <Fingerprint size={32} />,
      color: "text-emerald-500",
      bg: "bg-emerald-500/5",
      border: "border-emerald-500/10"
    },
    {
      title: "BLUEPRINT DA CONCORRÊNCIA",
      desc: "Não olhe apenas o anúncio. Mapeamos a landing page e o checkout vencedor. Tenha o mapa completo da operação rival em mãos.",
      icon: <Target size={32} />,
      color: "text-rose-500",
      bg: "bg-rose-500/5",
      border: "border-rose-500/10"
    },
    {
      title: "MONITOR DE SATURAÇÃO",
      desc: "Saiba exatamente quando parar. Identificamos o declínio de performance para você não queimar caixa em criativos fadigados.",
      icon: <LineChart size={32} />,
      color: "text-amber-500",
      bg: "bg-amber-500/5",
      border: "border-amber-500/10"
    },
    {
      title: "INTELIGÊNCIA ACUMULADA",
      desc: "Acesso a 50.000 sinais de escala validados. Filtre o ouro por nicho e ticket em segundos para ganhar velocidade de execução.",
      icon: <Database size={32} />,
      color: "text-indigo-500",
      bg: "bg-indigo-500/5",
      border: "border-indigo-500/10"
    },
    {
      title: "ANÁLISE DE TIMING",
      desc: "Detectamos ofertas em ascensão meteórica. Entre no jogo enquanto o ROI ainda é agressivo e a concorrência é inexistente.",
      icon: <Zap size={32} />,
      color: "text-orange-500",
      bg: "bg-orange-500/5",
      border: "border-orange-500/10"
    }
  ];

  return (
    <div className="space-y-24 animate-in fade-in duration-1000 max-w-[1500px] mx-auto pb-40">
      <header className="relative flex flex-col lg:flex-row gap-16 items-center pt-10 px-4">
        <div className="flex-1 space-y-8 relative z-10 text-center lg:text-left">
          <div className="inline-flex items-center gap-3 bg-blue-600/10 backdrop-blur-md border border-blue-500/20 px-5 py-2 rounded-full text-blue-500 text-[9px] font-black uppercase tracking-[0.3em] italic">
            <div className="w-1 h-1 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,1)]" />
            Inteligência de Escala Ativada
          </div>

          <div className="space-y-4">
            <h1 className="text-6xl md:text-9xl font-black text-slate-900 dark:text-white tracking-tighter leading-[0.8] italic uppercase transition-theme">
              DOMINE O <br />
              <span className="text-blue-600">MERCADO.</span>
            </h1>
          </div>

          <p className="text-slate-400 dark:text-slate-500 font-bold max-w-lg text-lg leading-relaxed uppercase tracking-tight italic opacity-80 mx-auto lg:mx-0">
            AUDITORIA TÉCNICA DE CRIATIVOS EM ESCALA GLOBAL.
          </p>

          <div className="flex flex-wrap justify-center lg:justify-start gap-4 pt-4">
            <button
              onClick={() => onNavigate('library')}
              className="bg-blue-600 hover:bg-blue-500 text-white px-14 py-6 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-2xl shadow-blue-600/30 active:scale-95 italic flex items-center gap-3 group"
            >
              EXPLORAR BASE <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        <div
          className="lg:w-[580px] w-full aspect-[4/5] bg-white dark:bg-[#020617] rounded-[56px] border border-slate-200 dark:border-white/5 relative overflow-hidden group shadow-2xl dark:shadow-[0_0_120px_rgba(37,99,235,0.15)] cursor-pointer transition-theme mx-4"
          onClick={() => currentAd && onAdClick(currentAd)}
        >
          {currentAd ? (
            <div className={`absolute inset-0 transition-all duration-500 ease-out ${isExiting ? 'opacity-0 scale-105' : 'opacity-100 scale-100'}`}>

              <div className="absolute inset-0 bg-black flex items-center justify-center">
                {isVideo ? (
                  <video
                    key={currentAd.id}
                    src={currentAd.mediaUrl}
                    className="w-full h-full object-cover"
                    autoPlay
                    muted
                    loop
                    playsInline
                  />
                ) : null}

                <img
                  key={currentAd.id + '_img'}
                  src={creativeMedia}
                  className={`w-full h-full object-cover ${isVideo ? 'hidden' : 'block'}`}
                  alt=""
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=AD&background=1e293b&color=3b82f6&size=1024&bold=true`;
                  }}
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black dark:from-[#020617] via-transparent to-black/20" />
              </div>

              <div className="absolute bottom-12 left-12 right-12 flex flex-col gap-8">
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="px-4 py-1.5 bg-red-600 rounded-xl text-[10px] font-black italic uppercase tracking-widest text-white animate-pulse shadow-[0_0_25px_rgba(220,38,38,0.5)]">
                      {currentAd.isFeatured ? 'CURADORIA ELITE' : 'LIVE ESCALA'}
                    </div>
                  </div>
                  <h3 className="text-4xl font-black italic uppercase text-white tracking-tighter leading-none drop-shadow-2xl">
                    {currentAd.title}
                  </h3>
                </div>

                <div className="flex gap-6">
                  <div className="flex-1 bg-white p-8 rounded-[40px] shadow-2xl flex flex-col items-center justify-center transform group-hover:scale-105 transition-transform">
                    <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Ativos Duplicados</span>
                    <span className="text-6xl font-black text-[#020617] italic tracking-tighter leading-none">
                      {currentAd.adCount}
                    </span>
                  </div>

                  <div className="w-28 bg-blue-600/90 backdrop-blur-md p-8 rounded-[40px] flex items-center justify-center text-white">
                    <Zap size={40} fill="currentColor" />
                  </div>
                </div>
              </div>

              <div className="absolute inset-0 pointer-events-none opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]" />

              <div className="absolute bottom-0 left-0 h-1.5 bg-blue-600 transition-all duration-[4000ms] ease-linear" style={{ width: isExiting ? '100%' : '0%' }} />
            </div>
          ) : null}
        </div>
      </header>

      {/* VANTAGENS ELITE - BLOCOS MAIORES E DESCRITIVOS */}
      <section className="px-4 space-y-12">
        <div className="flex flex-col gap-2 mb-4">
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] italic mb-1">NÃO É SORTE. É LEITURA DE SINAIS.</span>
          <h2 className="text-3xl font-black text-slate-900 dark:text-white uppercase italic tracking-tighter">SINAIS QUE JÁ PROVARAM QUE FUNCIONAM.</h2>
          <p className="text-slate-500 font-bold uppercase italic tracking-widest text-xs opacity-60">Se está aqui, passou do teste. O resto é apenas ruído.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {eliteFeatures.map((feature, i) => (
            <div
              key={i}
              className={`group ${feature.bg} p-10 rounded-[48px] border ${feature.border} flex flex-col gap-6 transition-all hover:scale-[1.03] hover:shadow-2xl hover:shadow-blue-600/5 cursor-default relative overflow-hidden`}
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className={`w-20 h-20 rounded-[28px] bg-white dark:bg-white/5 shadow-xl flex items-center justify-center ${feature.color} transform group-hover:rotate-6 transition-transform`}>
                {feature.icon}
              </div>

              <div className="space-y-3 relative z-10">
                <h4 className="text-xl font-black uppercase italic text-slate-900 dark:text-white tracking-tight">{feature.title}</h4>
                <p className="text-sm font-bold text-slate-500 dark:text-slate-400 leading-relaxed italic opacity-80">
                  {feature.desc}
                </p>
              </div>

              <div className="pt-4 flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest italic opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                DADO VERIFICADO <ShieldCheck size={14} />
              </div>
            </div>
          ))}
        </div>

        <div className="text-center pt-8 border-t border-slate-200 dark:border-white/5">
          <p className="text-slate-400 dark:text-slate-500 font-black uppercase text-[11px] tracking-[0.2em] italic">
            Enquanto você testa, outros já estão escalando.
          </p>
        </div>
      </section>

      {/* QUICK STATS BENEFITS - Mantido mas integrado ao fluxo */}
      <div className="px-4 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
        {[
          { title: "SINAL VALIDADO", desc: "Volume real.", icon: <Globe size={18} />, color: "text-blue-500" },
          { title: "PADRÃO ELITE", desc: "Estrutura vencedora.", icon: <Cpu size={18} />, color: "text-emerald-500" },
          { title: "MÉTRICAS REAIS", desc: "Dados brutos.", icon: <TrendingUp size={18} />, color: "text-rose-500" },
          { title: "ENGENHARIA FORENSE", desc: "Dissecação de copy.", icon: <Layers size={18} />, color: "text-amber-500" },
          { title: "RETENÇÃO BRUTA", desc: "Ganchos testados.", icon: <Anchor size={18} />, color: "text-indigo-500" },
          { title: "NOVAS OFERTAS", desc: "Radar de ângulos.", icon: <Target size={18} />, color: "text-orange-500" },
          { title: "MONITOR DE ESCALA", desc: "Fadiga monitorada.", icon: <LineChart size={18} />, color: "text-fuchsia-500" }
        ].map((benefit, i) => (
          <div key={i} className="bg-white dark:bg-[#020617] p-6 rounded-[32px] border border-slate-200 dark:border-white/5 flex flex-col items-center text-center group hover:border-blue-500/30 transition-all shadow-sm">
            <div className={`p-3 rounded-2xl bg-slate-50 dark:bg-white/5 ${benefit.color} mb-4 group-hover:scale-110 transition-transform`}>
              {benefit.icon}
            </div>
            <h4 className="text-[10px] font-black uppercase italic text-slate-900 dark:text-white mb-1 leading-tight">{benefit.title}</h4>
            <p className="text-[8px] font-bold text-slate-500 uppercase italic opacity-60">{benefit.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
