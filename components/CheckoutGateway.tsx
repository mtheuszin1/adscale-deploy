
import React, { useState, useEffect } from 'react';
import { CreditCard, QrCode, ShieldCheck, CheckCircle2, Loader2, Lock, AlertTriangle, Zap, Copy, Ban } from 'lucide-react';
import { api } from '../services/api';

interface CheckoutGatewayProps {
  planName: string; // Used for display only
  price: string;    // Used for initial display fallback
  onSuccess: (method: 'stripe' | 'pix') => void;
  onCancel: () => void;
}

const CheckoutGateway: React.FC<CheckoutGatewayProps> = ({ planName, onSuccess, onCancel }) => {
  const [method, setMethod] = useState<'card' | 'pix'>('pix');
  const [status, setStatus] = useState<'initializing' | 'selecting' | 'loading' | 'pix_pending' | 'success' | 'error' | 'disabled'>('initializing');

  // Dynamic Config State
  const [config, setConfig] = useState<{ active: boolean, amount: number, currency: string } | null>(null);

  // Pix Data
  const [pixData, setPixData] = useState<{ qr_code: string, copy_paste: string, tx_id: string } | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // 1. Initial Config Fetch
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const cfg = await api.getPublicCheckoutConfig();
        setConfig(cfg);
        if (!cfg.active) {
          setStatus('disabled');
        } else {
          setStatus('selecting');
        }
      } catch (e) {
        console.error("Failed to load checkout config", e);
        setStatus('error');
        setErrorMsg("Falha ao carregar configurações de pagamento.");
      }
    };
    fetchConfig();
  }, []);

  // Polling Effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === 'pix_pending' && pixData?.tx_id) {
      interval = setInterval(async () => {
        try {
          const res = await api.checkPaymentStatus(pixData.tx_id);
          if (res.status === 'succeeded') {
            setStatus('success');
            clearInterval(interval);
            setTimeout(() => onSuccess('pix'), 3000);
          }
        } catch (e) {
          console.error("Polling error", e);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [status, pixData]);

  const handleStartPix = async () => {
    setStatus('loading');
    setErrorMsg(null);
    try {
      // Backend uses Admin Config, no price_id needed from frontend
      const res = await api.createPixPayment();

      setPixData({
        qr_code: res.qr_code_url,
        copy_paste: res.qr_code_text,
        tx_id: res.transaction_id
      });
      setStatus('pix_pending');
    } catch (e: any) {
      console.error("Pix Error:", e);
      setStatus('error');
      if (e.message.includes("501") || e.message.includes("AINDA NÃO IMPLEMENTADO")) {
        setErrorMsg("PAGAMENTO AINDA NÃO IMPLEMENTADO");
      } else if (e.message.includes("503")) {
        setErrorMsg("Vendas temporariamente suspensas pelo Administrador.");
        setStatus('disabled');
      } else {
        setErrorMsg("Erro ao gerar Pix. Tente novamente.");
      }
    }
  };

  if (status === 'initializing') {
    return (
      <div className="bg-white p-10 rounded-[48px] border border-slate-100 text-center w-full max-w-xl mx-auto shadow-sm flex flex-col items-center justify-center min-h-[400px]">
        <Loader2 className="animate-spin text-blue-500 mb-4" size={32} />
        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Carregando Checkout Seguro...</p>
      </div>
    )
  }

  if (status === 'disabled') {
    return (
      <div className="bg-white p-10 rounded-[48px] border border-slate-100 text-center space-y-6 max-w-xl mx-auto shadow-sm">
        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto text-slate-400">
          <Ban size={32} />
        </div>
        <h3 className="text-xl font-black uppercase italic text-slate-900">Vendas Encerradas</h3>
        <p className="text-slate-400 text-xs font-bold italic">
          O Administrador encerrou as vendas temporariamente. <br /> Tente novamente mais tarde.
        </p>
        <button onClick={onCancel} className="text-blue-500 font-black uppercase text-[10px] tracking-widest hover:underline">Voltar</button>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
        <div className="w-20 h-20 bg-emerald-500/10 rounded-[32px] flex items-center justify-center mx-auto text-emerald-500 border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
          <CheckCircle2 size={40} />
        </div>
        <h3 className="text-2xl font-black uppercase italic text-slate-900">Pagamento Confirmado</h3>
        <p className="text-slate-400 text-sm font-medium italic">Sua chave de acesso premium foi ativada. Redirecionando...</p>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="bg-white p-10 rounded-[48px] border border-red-500/20 text-center space-y-6 max-w-xl mx-auto shadow-sm">
        <div className="w-16 h-16 bg-red-500/10 rounded-2xl flex items-center justify-center mx-auto text-red-500">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-xl font-black uppercase italic text-slate-900">{errorMsg || "Erro no Pagamento"}</h3>
        <p className="text-slate-400 text-xs font-bold italic">
          O sistema de pagamentos não está disponível no momento para esta operação.
        </p>
        <button onClick={onCancel} className="text-blue-500 font-black uppercase text-[10px] tracking-widest hover:underline">Voltar</button>
      </div>
    );
  }

  // Formatting Price dynamically
  const displayPrice = config
    ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: config.currency }).format(config.amount)
    : '...';

  return (
    <div className="bg-white border border-slate-100 rounded-[48px] overflow-hidden w-full max-w-xl shadow-xl animate-in fade-in slide-in-from-bottom-4 duration-500 text-left">
      {/* Header */}
      <div className="bg-slate-50 p-10 border-b border-slate-100">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center font-black italic text-white text-sm">AS</div>
            <h2 className="text-xl font-black uppercase italic tracking-tighter text-slate-900">Checkout Seguro</h2>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-900 transition-colors uppercase text-[10px] font-black tracking-widest">Cancelar</button>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 flex justify-between items-center shadow-sm">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Resumo do Pedido</p>
            <h4 className="text-lg font-black text-slate-900 uppercase italic">{planName}</h4>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-blue-600 italic">{displayPrice}</p>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Assinatura Mensal</p>
          </div>
        </div>
      </div>

      <div className="p-10 space-y-8">
        {/* Method Selection (Simplified for Pix Focus) */}
        <div className="flex gap-4">
          <button
            onClick={() => setMethod('pix')}
            className={`flex-1 p-4 rounded-2xl border transition-all flex items-center gap-3 ${method === 'pix' ? 'border-emerald-500 bg-emerald-500/5' : 'border-slate-100 opacity-50'}`}
          >
            <QrCode className="text-emerald-500" size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">PIX</span>
          </button>
          <button disabled className="flex-1 p-4 rounded-2xl border border-slate-100 opacity-30 flex items-center gap-3 cursor-not-allowed">
            <CreditCard className="text-slate-300" size={20} />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Cartão (Em breve)</span>
          </button>
        </div>

        {status === 'selecting' && (
          <button
            onClick={handleStartPix}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-6 rounded-[28px] font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-500/20 flex items-center justify-center gap-3 italic"
          >
            <Zap size={18} /> Gerar Pix para Pagamento
          </button>
        )}

        {status === 'loading' && (
          <div className="py-10 flex flex-col items-center gap-4 text-slate-400">
            <Loader2 className="animate-spin text-blue-500" size={32} />
            <span className="text-xs font-bold uppercase tracking-widest">Conectando ao Gateway...</span>
          </div>
        )}

        {status === 'pix_pending' && pixData && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="text-center space-y-2">
              <h3 className="text-slate-900 font-bold italic">Escaneie o QR Code</h3>
              <p className="text-slate-400 text-xs">Pague pelo app do seu banco. A liberação é automática.</p>
            </div>

            <div className="bg-white p-2 rounded-2xl w-48 h-48 mx-auto border border-slate-100 shadow-sm">
              <img src={pixData.qr_code} alt="QR Code Pix" className="w-full h-full object-contain" />
            </div>

            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Pix Copia e Cola</label>
              <div className="flex gap-2">
                <input readOnly value={pixData.copy_paste} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 text-xs text-slate-500 font-mono truncate" />
                <button
                  onClick={() => navigator.clipboard.writeText(pixData.copy_paste)}
                  className="p-3 bg-white border border-slate-200 text-slate-400 hover:text-slate-900 rounded-xl transition-colors"
                >
                  <Copy size={16} />
                </button>
              </div>
            </div>

            <div className="flex items-center justify-center gap-2 text-emerald-500 bg-emerald-500/5 p-3 rounded-xl border border-emerald-500/10">
              <Loader2 size={14} className="animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-widest">Aguardando confirmação do banco...</span>
            </div>
          </div>
        )}

        <div className="flex items-center justify-center gap-4 pt-4 border-t border-white/5 opacity-40">
          <div className="flex items-center gap-2">
            <ShieldCheck size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest">Ambiente Seguro</span>
          </div>
          <div className="flex items-center gap-2">
            <Lock size={14} />
            <span className="text-[9px] font-black uppercase tracking-widest">SSL 256-BIT</span>
          </div>
        </div>
      </div>
    </div>
  );
};


export default CheckoutGateway;
