
import React, { useState } from 'react';
import { Check, Zap, Shield, Sparkles, ArrowRight, PartyPopper } from 'lucide-react';
import CheckoutGateway from '../components/CheckoutGateway';

/*
 * PRICING ENGINE - HANDLES PLAN SELECTION AND CHECKOUT REDIRECT
 */

interface PricingPageProps {
  onSubscribe: () => void;
}

const PricingPage: React.FC<PricingPageProps> = ({ onSubscribe }) => {
  const [selectedPlan, setSelectedPlan] = useState<{ name: string, price: string, id: string } | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubscribeSuccess = () => {
    setIsSuccess(true);
    setTimeout(() => {
      onSubscribe();
    }, 3000);
  };

  const plans = [
    {
      id: 'monthly',
      name: 'Plano Básico Mensal',
      price: 'R$ 67,00',
      period: '/mês',
      features: [
        'Acesso completo à plataforma',
        'Relatórios e insights de desempenho',
        'Suporte prioritário',
        'Notificações automáticas de campanhas',
        'Atualizações regulares'
      ],
      recommended: false,
    },
    {
      id: 'yearly',
      name: 'Plano Pro Anual',
      price: 'R$ 720,00',
      period: '/ano',
      description: '10% de desconto real',
      features: [
        'Tudo do plano mensal',
        'Economia de R$ 84,00/ano',
        'Consultoria estratégica trimestral',
        'Acesso antecipado a tendências',
        'Suporte via canal exclusivo'
      ],
      recommended: true,
    }
  ];

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6 text-center animate-in fade-in duration-500">
        <div className="max-w-md space-y-8">
          <div className="w-24 h-24 bg-emerald-500/10 border border-emerald-500/20 rounded-[32px] flex items-center justify-center mx-auto text-emerald-500 shadow-[0_0_50px_rgba(16,185,129,0.2)] animate-bounce">
            <PartyPopper size={48} />
          </div>
          <div className="space-y-4">
            <h2 className="text-4xl font-black italic uppercase tracking-tighter text-slate-900">Parabéns!</h2>
            <p className="text-slate-500 font-bold text-lg leading-relaxed italic">
              Você agora faz parte da elite ADSCALE. Seu acesso está sendo configurado e você será redirecionado em segundos...
            </p>
          </div>
          <div className="flex justify-center gap-2">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" />
          </div>
        </div>
      </div>
    );
  }

  if (selectedPlan) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <CheckoutGateway
          planName={selectedPlan.name}
          price={selectedPlan.price}
          onSuccess={() => handleSubscribeSuccess()}
          onCancel={() => setSelectedPlan(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-20 px-6 overflow-x-hidden">
      <div className="max-w-5xl mx-auto relative">
        {/* Decor Blur */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-blue-600/5 blur-[120px] pointer-events-none" />

        <div className="text-center mb-16 relative z-10">
          <span className="bg-blue-600/10 text-blue-500 px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.4em] border border-blue-600/30 mb-8 inline-block italic">
            SELECIONE SEU PROTOCOLO DE ACESSO
          </span>
          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-8 leading-none italic uppercase text-slate-900">
            Libere a <span className="text-blue-600">Inteligência</span> <br /> de Elite agora.
          </h1>
          <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium italic">
            Assine agora e tenha em mãos o que já está validado e escalando nos maiores leilões do Brasil.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 relative z-10">
          {plans.map((plan, i) => (
            <div
              key={i}
              className={`relative bg-slate-50 border rounded-[48px] p-12 flex flex-col transition-all hover:shadow-xl hover:scale-[1.01] ${plan.recommended ? 'border-blue-500 shadow-xl shadow-blue-600/5' : 'border-slate-100'
                }`}
            >
              {plan.recommended && (
                <div className="absolute -top-5 right-12 bg-blue-600 text-white px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-xl italic">
                  <Sparkles size={14} /> Recomendado
                </div>
              )}

              <div className="mb-10">
                <h3 className="text-xl font-black uppercase italic text-slate-900 mb-6 tracking-tight">{plan.name}</h3>
                <div className="flex items-end gap-2 mb-3">
                  <span className="text-6xl font-black font-mono tracking-tighter text-slate-900">{plan.price}</span>
                  <span className="text-slate-400 mb-2 font-bold uppercase text-xs tracking-widest">{plan.period}</span>
                </div>
                {plan.description && <p className="text-emerald-500 text-sm font-black uppercase tracking-widest italic">{plan.description}</p>}
              </div>

              <div className="space-y-5 mb-12 flex-1">
                {plan.features.map((feat, j) => (
                  <div key={j} className="flex items-center gap-4 text-slate-400">
                    <div className="w-6 h-6 bg-blue-600/10 border border-blue-500/20 rounded-full flex items-center justify-center">
                      <Check size={14} className="text-blue-500" />
                    </div>
                    <span className="text-sm font-bold uppercase tracking-tight italic">{feat}</span>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setSelectedPlan({ name: plan.name, price: plan.price, id: plan.id })}
                className={`w-full py-6 rounded-3xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-3 italic ${plan.recommended
                    ? 'bg-blue-600 text-white hover:bg-blue-500 shadow-xl shadow-blue-600/30'
                    : 'bg-slate-900 text-white hover:bg-slate-800'
                  }`}
              >
                ASSINAR AGORA <ArrowRight size={18} />
              </button>
            </div>
          ))}
        </div>

        <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-10 text-center border-t border-slate-900 pt-16">
          <div className="space-y-4">
            <div className="bg-blue-600/10 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
              <Shield size={24} className="text-blue-500" />
            </div>
            <h4 className="font-black uppercase text-sm tracking-widest italic">Acesso Blindado</h4>
            <p className="text-xs text-slate-500 font-medium italic">Protocolos de segurança máxima em todas as transações.</p>
          </div>
          <div className="space-y-4">
            <div className="bg-blue-600/10 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
              <Zap size={24} className="text-blue-500" />
            </div>
            <h4 className="font-black uppercase text-sm tracking-widest italic">Ativação Imediata</h4>
            <p className="text-xs text-slate-500 font-medium italic">Receba suas credenciais instantaneamente após a aprovação.</p>
          </div>
          <div className="space-y-4">
            <div className="bg-blue-600/10 w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/20">
              <Sparkles size={24} className="text-blue-500" />
            </div>
            <h4 className="font-black uppercase text-sm tracking-widest italic">Garantia Elite</h4>
            <p className="text-xs text-slate-500 font-medium italic">Satisfação absoluta com nossa base de dados ou estorno completo.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;
