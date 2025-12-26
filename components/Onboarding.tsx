
import React, { useState } from 'react';
import { Sparkles, ArrowRight, Zap, Rocket, X, Play, Target, ShieldCheck } from 'lucide-react';

interface OnboardingProps {
  onComplete: (startTour: boolean) => void;
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  const steps = [
    {
      title: "Bem-vindo à Elite",
      desc: "Você acaba de acessar o terminal de inteligência mais avançado para tráfego pago. Aqui, dados não são apenas números, são munição.",
      icon: <ShieldCheck className="text-blue-500" size={40} />,
      accent: "blue"
    },
    {
      title: "Interceptação em Tempo Real",
      desc: "Nossos robôs varrem a biblioteca global 24/7. Quando um criativo escala, ele aparece no seu Radar antes de todo o mercado.",
      icon: <Target className="text-rose-500" size={40} />,
      accent: "rose"
    },
    {
      title: "Engenharia Reversa IA",
      desc: "Analisamos copies, ganchos e mecanismos únicos com Gemini 3 Pro para que você possa modelar o que já é lucrativo em segundos.",
      icon: <Zap className="text-amber-500" size={40} />,
      accent: "amber"
    }
  ];

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-950/95 backdrop-blur-2xl animate-in fade-in duration-700">
      {/* Background Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-600/10 blur-[150px] -z-10 rounded-full animate-pulse" />
      
      <div className="bg-[#050914] border border-white/10 w-full max-w-2xl rounded-[48px] overflow-hidden shadow-[0_0_100px_rgba(37,99,235,0.15)] flex flex-col md:flex-row animate-in zoom-in-95 duration-500">
        
        {/* Lado Esquerdo - Visual */}
        <div className="md:w-1/3 bg-blue-600 p-12 flex flex-col justify-between relative overflow-hidden">
           <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-indigo-900" />
           <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
           <div className="relative z-10">
              <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black italic text-blue-600 shadow-xl mb-6">AS</div>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/60 italic">Operação AdScale</p>
           </div>
           <div className="relative z-10 text-white">
              <div className="text-4xl font-black italic uppercase leading-none mb-2">v4.1</div>
              <div className="text-[8px] font-black uppercase tracking-[0.2em] opacity-40">Build 2025.03_Elite</div>
           </div>
        </div>

        {/* Lado Direito - Conteúdo */}
        <div className="md:w-2/3 p-12 space-y-10 flex flex-col justify-center">
          <div className="flex flex-col items-start space-y-6">
            <div className={`w-20 h-20 rounded-3xl flex items-center justify-center border shadow-inner transition-colors duration-500 ${
              step === 0 ? 'bg-blue-600/10 border-blue-500/20' : step === 1 ? 'bg-rose-500/10 border-rose-500/20' : 'bg-amber-500/10 border-amber-500/20'
            }`}>
              {steps[step].icon}
            </div>
            
            <div className="space-y-4">
              <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white leading-tight">{steps[step].title}</h2>
              <p className="text-slate-400 text-sm font-bold leading-relaxed italic opacity-80">{steps[step].desc}</p>
            </div>

            <div className="flex gap-2">
              {steps.map((_, i) => (
                <div key={i} className={`h-1.5 rounded-full transition-all duration-500 ${step === i ? 'w-10 bg-blue-500' : 'w-2 bg-slate-800'}`} />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {step < steps.length - 1 ? (
              <button 
                onClick={() => setStep(step + 1)}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-blue-600/20 italic active:scale-95"
              >
                Próximo Passo <ArrowRight size={18} />
              </button>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                <button 
                  onClick={() => onComplete(true)}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl shadow-emerald-600/20 italic active:scale-95"
                >
                  <Play size={18} fill="currentColor" /> Iniciar Tour Guiado
                </button>
                <button 
                  onClick={() => onComplete(false)}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-slate-400 py-6 rounded-3xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 italic"
                >
                  Pular para o Painel
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
