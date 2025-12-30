import React, { useState, useEffect, useMemo } from 'react';
import { TrendingUp, Globe, Cpu, Layers, Loader2, ChevronRight, Target, Anchor, LineChart, Zap, ShieldCheck, Fingerprint, ArrowRight } from 'lucide-react';
import { Ad } from '../types';

interface DashboardProps {
  ads: Ad[];
  onAdClick: (ad: Ad) => void;
  onNavigate: (page: string) => void;
  isSubscribed?: boolean;
}

const Dashboard: React.FC<DashboardProps> = ({ ads, onAdClick, onNavigate }) => {
  const [activeIndex, setActiveIndex] = useState(0);

  // Lógica de Curadoria: Prioriza marcados pelo Admin, depois os com maior volume
  const featuredAds = useMemo(() => {
    return [...ads]
      .filter(ad => ad.isVisible !== false)
      .sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        if (a.isFeatured && b.isFeatured) {
          return (a.displayOrder || 0) - (b.displayOrder || 0);
        }
        return b.adCount - a.adCount;
      })
      .slice(0, 10);
  }, [ads]);

  useEffect(() => {
    if (featuredAds.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % featuredAds.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [featuredAds]);

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
      icon: <Cpu size={32} />,
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
    <div className="space-y-16 animate-in fade-in duration-700">
      {/* Hero Intercept Section */}
      <section className="relative h-[600px] bg-slate-50 border border-slate-100 rounded-[64px] overflow-hidden flex flex-col md:flex-row shadow-sm">
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

        <div className="flex-1 p-12 md:p-20 flex flex-col justify-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-600/10 text-blue-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest mb-8 border border-blue-600/20 italic">
            <span className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
            Interceptando agora
          </div>

          <h1 className="text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-slate-900 leading-[0.9] mb-8">
            AdScale <br /> <span className="text-blue-600">Radar.</span>
          </h1>

          <p className="text-slate-400 text-lg md:text-xl font-medium max-w-lg mb-12 italic leading-relaxed">
            A maior rede de interceptação de sinais de escala do Brasil. Dados reais, criativos validados e métricas em tempo real.
          </p>

          <div className="flex items-center gap-6">
            <button
              onClick={() => onNavigate && onNavigate('library')}
              className="bg-slate-900 text-white px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/10 italic flex items-center gap-3"
            >
              Acessar Biblioteca <ChevronRight size={18} />
            </button>
            <button
              onClick={() => onNavigate && onNavigate('scaling')}
              className="bg-white text-slate-900 border border-slate-200 px-10 py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all italic flex items-center gap-3"
            >
              Sinais Live <Zap size={18} />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-100 relative group hidden md:block">
          <div className="absolute inset-0 bg-gradient-to-r from-slate-50 to-transparent z-10" />
          <div key={activeIndex} className="h-full animate-in fade-in slide-in-from-right-20 duration-1000">
            <img
              src={featuredAds[activeIndex]?.thumbnail || `https://ui-avatars.com/api/?name=AD&background=e2e8f0&color=3b82f6&size=1024&bold=true`}
              className="w-full h-full object-cover grayscale opacity-20"
              alt=""
            />
          </div>
        </div>
      </section>

      {/* VANTAGENS ELITE */}
      <section className="px-4 space-y-12">
        <div className="flex flex-col gap-2 mb-4">
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-[0.4em] italic mb-1">NÃO É SORTE. É LEITURA DE SINAIS.</span>
          <h2 className="text-3xl font-black text-slate-900 uppercase italic tracking-tighter">SINAIS QUE JÁ PROVARAM QUE FUNCIONAM.</h2>
          <p className="text-slate-500 font-bold uppercase italic tracking-widest text-xs opacity-60">Se está aqui, passou do teste. O resto é apenas ruído.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {eliteFeatures.map((feature, i) => (
            <div
              key={i}
              className={`group ${feature.bg} p-10 rounded-[48px] border ${feature.border} flex flex-col gap-6 transition-all hover:scale-[1.03] hover:shadow-2xl hover:shadow-blue-600/5 cursor-default relative overflow-hidden`}
            >
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

              <div className={`w-20 h-20 rounded-[28px] bg-white shadow-xl flex items-center justify-center ${feature.color} transform group-hover:rotate-6 transition-transform`}>
                {feature.icon}
              </div>

              <div className="space-y-3 relative z-10">
                <h4 className="text-xl font-black uppercase italic text-slate-900 tracking-tight">{feature.title}</h4>
                <p className="text-sm font-bold text-slate-500 leading-relaxed italic opacity-80">
                  {feature.desc}
                </p>
              </div>

              <div className="pt-4 flex items-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-widest italic opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                DADO VERIFICADO <ShieldCheck size={14} />
              </div>
            </div>
          ))}
        </div>

        <div className="text-center pt-8 border-t border-slate-200">
          <p className="text-slate-400 font-black uppercase text-[11px] tracking-[0.2em] italic">
            Enquanto você testa, outros já estão escalando.
          </p>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-slate-900 rounded-[56px] p-12 md:p-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-600/10 blur-[120px]" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="max-w-xl">
            <h2 className="text-4xl md:text-5xl font-black italic uppercase tracking-tighter text-white mb-6 leading-none">
              A rede que mais <span className="text-blue-500">cresce</span> no Brasil.
            </h2>
            <p className="text-slate-400 font-medium text-lg italic mb-10">
              Junte-se a mais de 1.500 media buyers, afiliados e dropshippers que utilizam o AdScale para minerar ofertas.
            </p>
            <div className="grid grid-cols-2 gap-8">
              <div>
                <div className="text-3xl font-black text-blue-500 italic mb-1 uppercase tracking-tighter">1.5M+</div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Anúncios Interceptados</div>
              </div>
              <div>
                <div className="text-3xl font-black text-blue-500 italic mb-1 uppercase tracking-tighter">24/7</div>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Monitoramento Ativo</div>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate && onNavigate('pricing')}
            className="bg-white text-slate-900 px-12 py-6 rounded-3xl font-black text-sm uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-2xl flex items-center gap-4 italic"
          >
            Começar Agora <ArrowRight size={24} />
          </button>
        </div>
      </section>

      {/* Quick Access Grid */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 px-4">
        {[
          { icon: <Target className="text-blue-500" />, title: "Interceptação Direta", desc: "Acessamos a biblioteca de anúncios em tempo real." },
          { icon: <Zap className="text-emerald-500" />, title: "Métricas de Escala", desc: "Identificamos quais criativos estão recebendo orçamento." },
          { icon: <ShieldCheck className="text-indigo-500" />, title: "Dados Blindados", desc: "Inteligência proprietária para análise de concorrência." }
        ].map((f, i) => (
          <div key={i} className="bg-white border border-slate-100 p-10 rounded-[48px] shadow-sm hover:border-slate-200 transition-all group">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-8 border border-slate-100 group-hover:scale-110 transition-transform">
              {f.icon}
            </div>
            <h3 className="text-xl font-black uppercase italic text-slate-900 mb-4 tracking-tighter">{f.title}</h3>
            <p className="text-slate-400 font-medium text-sm leading-relaxed">{f.desc}</p>
          </div>
        ))}
      </section>
    </div>
  );
};

export default Dashboard;
