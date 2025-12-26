import React from 'react';
import { Info, Flame, Target, TrendingUp, AlertCircle } from 'lucide-react';

interface TooltipProps {
  label: string;
  value: string | number;
  niche: string;
  type: 'ctr' | 'score' | 'volume' | 'momentum';
}

const IntelligenceTooltip: React.FC<TooltipProps> = ({ label, value, niche, type }) => {
  const benchmarks: Record<string, number> = {
    'Saúde & Bem-estar': 4.2,
    'Finanças & Milhas': 3.8,
    'Apostas': 5.5,
    'Info-produtos': 4.0,
    'Negócios & SaaS': 3.5
  };

  const benchmark = benchmarks[niche] || 4.0;
  
  const getContent = () => {
    switch (type) {
      case 'ctr':
        const val = parseFloat(value.toString());
        let status = { text: 'Médio', color: 'text-slate-400', icon: <Target size={12} /> };
        if (val > benchmark * 1.3) status = { text: 'Top 5% 🔥', color: 'text-emerald-400', icon: <Flame size={12} /> };
        else if (val > benchmark) status = { text: 'Acima da Média', color: 'text-blue-400', icon: <TrendingUp size={12} /> };
        else if (val < benchmark * 0.7) status = { text: 'Crítico ⚠️', color: 'text-rose-400', icon: <AlertCircle size={12} /> };

        return (
          <div className="space-y-3">
            <div className="pb-2 border-b border-white/10">
              <p className="text-[10px] font-black uppercase text-white mb-1">Taxa de Cliques (CTR)</p>
              <p className="text-[9px] text-slate-500 leading-tight">Percentual de cliques sobre visualizações.</p>
            </div>
            <div className="space-y-1.5">
              <div className="flex justify-between text-[9px] font-bold">
                <span className="text-slate-500 uppercase">Excelente:</span>
                <span className="text-emerald-400">5.0%+</span>
              </div>
              <div className="flex justify-between text-[9px] font-bold pt-1 border-t border-white/5">
                <span className="text-white uppercase">Seu Dado:</span>
                <span className={`${status.color} flex items-center gap-1 font-black`}>{value}% - {status.text}</span>
              </div>
            </div>
            <div className="pt-2 text-[8px] font-black uppercase text-slate-600 tracking-tighter italic">
              Benchmark: {benchmark}%
            </div>
          </div>
        );
      
      case 'score':
        return (
          <div className="space-y-3">
            <div className="pb-2 border-b border-white/10">
              <p className="text-[10px] font-black uppercase text-white mb-1">ADSCALE Score IA</p>
              <p className="text-[9px] text-slate-500 leading-tight">Probabilidade de lucro baseada em correlação de dados.</p>
            </div>
            <div className="space-y-1.5">
              <p className="text-[9px] text-slate-300">90-100: Winner Absoluto 🏆</p>
              <p className="text-[9px] text-slate-300">Menos de 50: Risco de Fadiga</p>
            </div>
          </div>
        );

      case 'volume':
         return (
          <div className="space-y-3">
            <div className="pb-2 border-b border-white/10">
              <p className="text-[10px] font-black uppercase text-white mb-1">Volume de Ads Ativos</p>
              <p className="text-[9px] text-slate-500 leading-tight">Nível de orçamento injetado pela marca.</p>
            </div>
            <div className="space-y-1">
               <p className="text-[9px] text-slate-300">Escala: +40 ads</p>
               <p className="text-[9px] text-slate-300">Teste: Menos de 10 ads</p>
            </div>
          </div>
        );

      case 'momentum':
        return (
          <div className="space-y-3">
            <div className="pb-2 border-b border-white/10">
              <p className="text-[10px] font-black uppercase text-white mb-1">Constância (7 dias)</p>
              <p className="text-[9px] text-slate-500 leading-tight">Variação da intensidade de anúncios.</p>
            </div>
            <div className="space-y-1">
               <p className="text-[9px] text-emerald-400 font-bold">Crescente: Em expansão 📈</p>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="group relative inline-block">
      <div className="cursor-help text-slate-500 hover:text-white transition-colors">
        <Info size={10} />
      </div>
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-56 p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[100] animate-in fade-in slide-in-from-bottom-2">
        {getContent()}
        <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-slate-950" />
      </div>
    </div>
  );
};

export default IntelligenceTooltip;