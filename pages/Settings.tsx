
import React, { useState } from 'react';
// Added ShoppingCart and Calendar to the imports
import { User, Mail, Bell, Shield, Key, CreditCard, Zap, Link2, ShieldCheck, Globe, Loader2, Save, ExternalLink, RefreshCw, CheckCircle2, AlertTriangle, Lock, ShoppingCart, Calendar } from 'lucide-react';
import { User as UserType } from '../types';

interface SettingsProps {
  user: UserType | null;
}

const SettingsPage: React.FC<SettingsProps> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'gateway' | 'billing'>('profile');
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [gateway, setGateway] = useState('kirvano');
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected' | 'error'>('connected');

  const handleSave = () => {
    setIsSaving(true);
    setTimeout(() => {
      setIsSaving(false);
      alert('Infraestrutura AdScale updated successfully.');
    }, 1200);
  };

  const handleTestConnection = () => {
    setIsTesting(true);
    setTimeout(() => {
      setIsTesting(false);
      setConnectionStatus('connected');
    }, 2000);
  };

  return (
    <div className="max-w-6xl space-y-12 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-20">
      <header>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-2 h-8 bg-blue-600 rounded-full shadow-[0_0_15px_rgba(37,99,235,0.5)]" />
          <h1 className="text-5xl font-black tracking-tighter uppercase italic text-white">Configurações</h1>
        </div>
        <p className="text-slate-500 font-medium text-lg italic opacity-80">Painel de Controle de Identidade e Infraestrutura Financeira.</p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-12">
        {/* Navegação Lateral Estilizada */}
        <aside className="space-y-3">
          {[
            { id: 'profile', label: 'Perfil do Operador', icon: <User size={18} />, color: 'blue' },
            { id: 'security', label: 'Criptografia & Acesso', icon: <Shield size={18} />, color: 'blue' },
            { id: 'billing', label: 'Minha Assinatura', icon: <CreditCard size={18} />, color: 'blue' }
          ].map((item) => {

            const isActive = activeTab === item.id;
            const activeColors = item.color === 'emerald'
              ? 'bg-emerald-600 text-white shadow-emerald-600/20'
              : 'bg-blue-600 text-white shadow-blue-600/20';

            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-4 px-6 py-5 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all italic border ${isActive
                  ? `${activeColors} shadow-xl border-transparent`
                  : 'text-slate-500 border-white/5 hover:text-white hover:bg-white/5 hover:border-white/10'
                  }`}
              >
                {item.icon} {item.label}
              </button>
            );
          })}
        </aside>

        <div className="lg:col-span-3 space-y-10">
          {/* Aba Perfil */}
          {activeTab === 'profile' && (
            <section className="bg-[#0f172a]/40 border border-slate-800 rounded-[48px] p-12 space-y-10 backdrop-blur-xl animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between border-b border-white/5 pb-8">
                <h3 className="text-2xl font-black uppercase italic text-white tracking-tighter">Identidade do Operador</h3>
                <div className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">UUID: {user?.id}</div>
              </div>

              <div className="flex items-center gap-10">
                <div className="relative group">
                  <div className="w-32 h-32 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[40px] flex items-center justify-center text-5xl font-black shadow-2xl border border-white/10 italic">
                    {user?.name.charAt(0)}
                  </div>
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-[40px] flex items-center justify-center cursor-pointer">
                    <RefreshCw className="text-white" size={24} />
                  </div>
                </div>
                <div className="space-y-4">
                  <button className="bg-white text-slate-950 px-8 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-xl italic">Upload Novo Avatar</button>
                  <p className="text-[10px] text-slate-600 uppercase font-bold tracking-widest italic flex items-center gap-2">
                    <ShieldCheck size={12} className="text-blue-500" /> Criptografia Visual Ativa (AES-256)
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-10">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nome de Guerra</label>
                  <input
                    type="text"
                    defaultValue={user?.name}
                    className="w-full bg-slate-950/50 border border-slate-800 rounded-[20px] px-6 py-5 text-sm font-bold text-white focus:border-blue-600 outline-none transition-all shadow-inner italic"
                  />
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">E-mail Operacional</label>
                  <input
                    type="email"
                    defaultValue={user?.email}
                    className="w-full bg-slate-950 border border-slate-900 rounded-[20px] px-6 py-5 text-sm font-bold text-white opacity-40 cursor-not-allowed outline-none italic"
                    disabled
                  />
                </div>
              </div>

              <button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-blue-600 text-white px-12 py-6 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-blue-500 transition-all shadow-2xl shadow-blue-600/30 italic flex items-center gap-3 active:scale-95"
              >
                {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                Persistir Dados no Kernel
              </button>
            </section>
          )}

// Migrated to AdminCheckoutHub


          {/* Aba Assinatura (Faturamento) */}
          {activeTab === 'billing' && (
            <section className="bg-[#0f172a]/40 border border-slate-800 rounded-[48px] p-12 space-y-12 backdrop-blur-xl animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black uppercase italic text-white tracking-tighter">Status de Assinatura</h3>
                <span className={`px-6 py-2.5 rounded-full text-[10px] font-black uppercase border italic ${user?.subscriptionActive ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                  }`}>
                  {user?.subscriptionActive ? 'PROTOLCO ATIVO' : 'CONEXÃO EXPIRADA'}
                </span>
              </div>

              <div className="bg-black/60 border border-white/5 rounded-[40px] p-10 flex flex-col lg:flex-row items-center justify-between gap-10 shadow-inner">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest leading-none">Nível de Acesso Atual</p>
                  <p className="text-4xl font-black text-white italic uppercase tracking-tighter">
                    {user?.role === 'admin' ? 'Lifetime Intelligence' : 'Assinante Master'}
                  </p>
                  <div className="flex items-center gap-4 pt-2">
                    <p className="text-[11px] text-slate-400 font-bold italic flex items-center gap-2">
                      <Calendar size={14} className="text-blue-500" /> Próxima renovação: 12 de Abril, 2025
                    </p>
                    <p className="text-[11px] text-slate-400 font-bold italic flex items-center gap-2">
                      <CreditCard size={14} className="text-blue-500" /> Cartão: **** 8892
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-4 w-full lg:w-auto">
                  <button className="px-10 py-5 bg-white text-slate-950 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all italic shadow-xl hover:bg-blue-600 hover:text-white">
                    Alterar Plano
                  </button>
                  <button className="px-10 py-5 bg-slate-900 border border-slate-800 text-slate-500 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all italic hover:text-white hover:border-slate-700">
                    Histórico Financeiro
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 bg-slate-950 border border-slate-900 rounded-[32px] flex items-center gap-6">
                  <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                    <CheckCircle2 size={24} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Suporte Via</p>
                    <p className="text-sm font-black text-white uppercase italic">Canal Exclusivo Slack</p>
                  </div>
                </div>
                <div className="p-8 bg-slate-950 border border-slate-900 rounded-[32px] flex items-center gap-6">
                  <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500 border border-emerald-500/20">
                    <Zap size={24} />
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Bonus</p>
                    <p className="text-sm font-black text-white uppercase italic">Alertas em Tempo Real Ativos</p>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Aba Segurança */}
          {activeTab === 'security' && (
            <section className="bg-[#0f172a]/40 border border-slate-800 rounded-[48px] p-12 space-y-12 backdrop-blur-xl animate-in fade-in slide-in-from-right-4 duration-500">
              <div className="border-b border-white/5 pb-8">
                <h3 className="text-2xl font-black uppercase italic text-white tracking-tighter">Criptografia de Acesso</h3>
                <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-1">Gerencie chaves e senhas da rede segura.</p>
              </div>

              <div className="grid grid-cols-1 gap-10">
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Senha Atual do Terminal</label>
                  <input type="password" placeholder="••••••••" className="w-full bg-slate-950 border border-slate-800 rounded-[24px] px-8 py-5 text-white focus:border-blue-600 outline-none transition-all shadow-inner" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nova Chave de Acesso</label>
                    <input type="password" placeholder="Min 8 caracteres" className="w-full bg-slate-950 border border-slate-800 rounded-[24px] px-8 py-5 text-white focus:border-blue-600 outline-none transition-all shadow-inner" />
                  </div>
                  <div className="space-y-4">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Confirmar Nova Chave</label>
                    <input type="password" placeholder="Repita a chave" className="w-full bg-slate-950 border border-slate-800 rounded-[24px] px-8 py-5 text-white focus:border-blue-600 outline-none transition-all shadow-inner" />
                  </div>
                </div>
              </div>

              <div className="bg-blue-600/5 border border-blue-500/10 p-10 rounded-[40px] flex items-center justify-between gap-10">
                <div className="flex items-center gap-6">
                  <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 border border-blue-500/20">
                    <RefreshCw size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm font-black text-white uppercase italic">Autenticação de Dois Fatores (2FA)</h4>
                    <p className="text-xs text-slate-500 font-bold italic">Proteja sua conta com um nível extra de blindagem digital.</p>
                  </div>
                </div>
                <button className="bg-slate-900 border border-slate-800 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-all italic">Ativar 2FA</button>
              </div>

              <button onClick={handleSave} className="bg-blue-600 text-white px-12 py-6 rounded-3xl font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-2xl shadow-blue-600/30 italic active:scale-95">
                Atualizar Chaves de Segurança
              </button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
