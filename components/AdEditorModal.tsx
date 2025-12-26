
import React, { useState } from 'react';
import { X, Save, ImageIcon, Target, Layers, BarChart3, CircleDollarSign, Store, ShoppingBag, Facebook, Loader2, Globe, ShieldCheck, Type } from 'lucide-react';
import { Ad, AdStatus, Niche } from '../types';

interface AdEditorModalProps {
  ad: Ad;
  onClose: () => void;
  onSave: (updatedAd: Ad) => void;
}

const AdEditorModal: React.FC<AdEditorModalProps> = ({ ad, onClose, onSave }) => {
  const [formData, setFormData] = useState<Ad>({ ...ad });
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: name === 'adCount' ? parseInt(value) || 0 : value as any }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setTimeout(() => {
      onSave(formData);
      setIsSaving(false);
    }, 800);
  };

  const isVideo = formData.mediaUrl.toLowerCase().includes('.mp4') || formData.mediaUrl.toLowerCase().includes('video');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/98 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative bg-[#020617] w-full max-w-7xl max-h-[95vh] rounded-[40px] overflow-hidden border border-slate-800 shadow-[0_0_100px_rgba(37,99,235,0.15)] flex flex-col md:flex-row animate-in zoom-in-95 duration-300">
        
        {/* PAINEL ESQUERDO: PREVIEW REAL-TIME */}
        <div className="md:w-[45%] bg-black flex flex-col relative group overflow-hidden border-r border-slate-800 min-h-[400px] justify-center">
          <div className="absolute top-6 left-6 z-20 bg-blue-600 px-4 py-1.5 rounded-full text-[9px] font-black text-white uppercase tracking-widest italic">
            MODO EDIÇÃO / PREVIEW
          </div>
          
          <div className="w-full h-full relative flex items-center justify-center">
            {isVideo ? (
              <video 
                src={formData.mediaUrl} 
                className="w-full h-full object-contain opacity-60" 
                poster={formData.thumbnail} 
                autoPlay muted loop playsInline
              />
            ) : (
              <img 
                src={formData.mediaUrl || formData.thumbnail} 
                className="w-full h-full object-contain opacity-60" 
                alt="Preview" 
              />
            )}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="bg-blue-600/20 p-4 rounded-full border border-blue-500/30">
                <Target size={32} className="text-blue-500 animate-pulse" />
              </div>
            </div>
          </div>
        </div>

        {/* PAINEL DIREITO: FORMULÁRIO ESTRUTURADO */}
        <div className="md:w-[55%] p-10 md:p-14 overflow-y-auto custom-scrollbar flex flex-col bg-[#020617]">
          <div className="flex justify-between items-start mb-10">
            <div>
              <h2 className="text-4xl font-black text-white tracking-[0.2em] uppercase leading-none italic">AJUSTE DE SINAL</h2>
              <div className="w-20 h-1 bg-blue-600 mt-4" />
            </div>
            <button onClick={onClose} className="p-2.5 bg-slate-900/80 text-slate-400 rounded-2xl hover:text-white transition-all border border-slate-800">
              <X size={22} />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-10">
            {/* BRAND IDENTIFICATION BLOCK */}
            <div className="bg-white rounded-[32px] p-8 shadow-2xl border border-white/10">
              <div className="flex items-start gap-5 mb-6">
                <div className="relative shrink-0">
                  <img 
                    src={formData.brandLogo} 
                    className="w-16 h-16 rounded-full bg-slate-100 border border-slate-200 object-cover"
                    alt="Logo"
                  />
                  <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white p-1 rounded-full border-2 border-white">
                    <ShieldCheck size={12} />
                  </div>
                </div>
                <div className="flex-1 space-y-2">
                  <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest italic leading-none">NOME DA MARCA</span>
                  <input 
                    name="title" 
                    value={formData.title} 
                    onChange={handleChange}
                    className="w-full text-lg font-black text-slate-900 uppercase italic border-b-2 border-slate-100 focus:border-blue-500 outline-none pb-1 transition-all"
                  />
                </div>
              </div>
              
              <div className="space-y-2">
                <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest italic leading-none">CORPO DO ANÚNCIO (COPY)</span>
                <textarea 
                  name="copy" 
                  value={formData.copy} 
                  onChange={handleChange}
                  rows={4}
                  className="w-full text-[13px] text-slate-800 leading-relaxed font-medium bg-slate-50 border border-slate-100 rounded-2xl p-4 outline-none focus:border-blue-500 transition-all resize-none italic"
                />
              </div>
            </div>

            {/* STRUCTURED METADATA LIST EDITABLE */}
            <div className="space-y-8 pl-2">
              <div className="flex items-center gap-6">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-500">
                  <Target size={20} />
                </div>
                <div className="flex-1">
                  <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">NICHO</span>
                  <select 
                    name="niche" 
                    value={formData.niche} 
                    onChange={handleChange}
                    className="bg-transparent text-white font-black uppercase text-[14px] outline-none border-b border-white/10 focus:border-blue-500 transition-all w-full italic cursor-pointer"
                  >
                    {Object.values(Niche).map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-500">
                  <Layers size={20} />
                </div>
                <div className="flex-1">
                  <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">FUNIL ESTRATÉGICO</span>
                  <input 
                    name="funnelType" 
                    value={formData.funnelType} 
                    onChange={handleChange}
                    className="bg-transparent text-white font-black uppercase text-[14px] outline-none border-b border-white/10 focus:border-blue-500 transition-all w-full italic"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-500">
                  <BarChart3 size={20} />
                </div>
                <div className="flex-1">
                  <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">VOLUME DE ADS</span>
                  <input 
                    type="number"
                    name="adCount" 
                    value={formData.adCount} 
                    onChange={handleChange}
                    className="bg-transparent text-blue-500 font-black text-[14px] outline-none border-b border-white/10 focus:border-blue-500 transition-all w-full"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6">
                <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-slate-500">
                  <CircleDollarSign size={20} />
                </div>
                <div className="flex-1">
                  <span className="block text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-2">TICKET DE OFERTA</span>
                  <input 
                    name="ticketPrice" 
                    value={formData.ticketPrice} 
                    onChange={handleChange}
                    className="bg-transparent text-white font-black text-[14px] outline-none border-b border-white/10 focus:border-blue-500 transition-all w-full italic"
                  />
                </div>
              </div>
            </div>

            {/* EXTERNAL LINKS MANAGEMENT */}
            <div className="space-y-8 pt-8 border-t border-white/5">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-500">
                  <Store size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest italic">PÁGINA DE VENDAS</span>
                </div>
                <input 
                  name="salesPageUrl" 
                  value={formData.salesPageUrl} 
                  onChange={handleChange}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-[12px] font-bold text-blue-500 italic outline-none focus:border-blue-500 transition-all"
                />
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-500">
                  <ShoppingBag size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest italic">CHECKOUT DESTINO</span>
                </div>
                <input 
                  name="checkoutUrl" 
                  value={formData.checkoutUrl} 
                  onChange={handleChange}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-[12px] font-bold text-blue-500 italic outline-none focus:border-blue-500 transition-all"
                />
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-slate-500">
                  <Facebook size={14} />
                  <span className="text-[10px] font-black uppercase tracking-widest italic">URL DA BIBLIOTECA</span>
                </div>
                <input 
                  name="libraryUrl" 
                  value={formData.libraryUrl} 
                  onChange={handleChange}
                  className="w-full bg-slate-900/50 border border-slate-800 rounded-xl px-4 py-3 text-[12px] font-bold text-blue-500 italic outline-none focus:border-blue-500 transition-all"
                />
              </div>
            </div>

            {/* FOOTER ACTIONS */}
            <div className="flex items-center justify-end gap-6 pt-10 border-t border-white/5">
              <button 
                type="button" 
                onClick={onClose} 
                className="text-[10px] font-black uppercase text-slate-500 hover:text-white transition-all italic tracking-widest"
              >
                DESCARTAR
              </button>
              <button 
                type="submit" 
                disabled={isSaving}
                className="bg-blue-600 hover:bg-blue-500 text-white px-12 py-5 rounded-3xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl shadow-blue-600/30 flex items-center gap-3 italic active:scale-95 disabled:opacity-50"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                PERSISTIR NO KERNEL
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdEditorModal;
