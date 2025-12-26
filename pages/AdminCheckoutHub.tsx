
import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
    LayoutDashboard, Save, Ban, CheckCircle2, ShieldCheck, DollarSign,
    CreditCard, Activity, ArrowUpRight, ArrowDownRight, Clock, Search,
    Server, ShieldAlert, Lock, Eye, EyeOff
} from 'lucide-react';

export function AdminCheckoutHub() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Config State
    const [config, setConfig] = useState<any>(null);
    const [amount, setAmount] = useState(0);
    const [active, setActive] = useState(false);
    const [gateway, setGateway] = useState('stripe');
    const [credentials, setCredentials] = useState<any>({}); // { pixup_client_id: '', ... }

    // UI State
    const [showSecret, setShowSecret] = useState(false);

    // Data State
    const [transactions, setTransactions] = useState<any[]>([]);
    const [stats, setStats] = useState({ revenue: 0, successRate: 0, total: 0 });

    const [msg, setMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        loadData();
    }, []);

    // Safety Timeout
    useEffect(() => {
        if (loading) {
            const timer = setTimeout(() => {
                if (loading) {
                    console.error("Force stop loading due to timeout");
                    setLoading(false);
                    setMsg({ type: 'error', text: 'Timeout de conexão: Backend demorou a responder.' });
                }
            }, 10000); // 10s timeout
            return () => clearTimeout(timer);
        }
    }, [loading]);

    const loadData = async () => {
        try {
            setLoading(true);
            const [settingsData, txData] = await Promise.all([
                api.getAdminCheckoutSettings(),
                api.getAdminTransactions()
            ]);

            // Config
            setConfig(settingsData);
            setAmount(settingsData.amount);
            setActive(settingsData.active);
            setGateway(settingsData.gateway);
            setCredentials(settingsData.credentials || {});

            // Transactions & Stats
            setTransactions(txData);
            calculateStats(txData);

        } catch (e) {
            console.error(e);
            setMsg({ type: 'error', text: 'Falha ao carregar dados do hub.' });
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (txs: any[]) => {
        const total = txs.length;
        if (total === 0) {
            setStats({ revenue: 0, successRate: 0, total: 0 });
            return;
        }

        const paidTxs = txs.filter(t => t.status === 'paid');
        const revenue = paidTxs.reduce((acc, t) => acc + t.amount, 0);
        const rate = (paidTxs.length / total) * 100;

        setStats({
            revenue: paidTxs.reduce((acc, t) => acc + t.amount, 0),
            successRate: rate,
            total
        });

        // Correct revenue calculation (Redundant but clear)
        setStats({
            revenue: paidTxs.reduce((acc, t) => acc + t.amount, 0),
            successRate: rate,
            total
        });
    };

    const handleSave = async () => {
        setSaving(true);
        setMsg(null);
        try {
            await api.updateAdminCheckoutSettings({
                amount: Number(amount),
                active,
                gateway,
                credentials
            });
            setMsg({ type: 'success', text: 'Configurações e credenciais salvas com sucesso!' });
            // Reload config
            const settingsData = await api.getAdminCheckoutSettings();
            setConfig(settingsData);
        } catch (e) {
            setMsg({ type: 'error', text: 'Erro ao salvar configurações.' });
        } finally {
            setSaving(false);
        }
    };

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);
    };

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleString('pt-BR');
    };

    const updateCredential = (key: string, value: string) => {
        setCredentials((prev: any) => ({ ...prev, [key]: value }));
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-slate-950">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen p-8 lg:p-12 space-y-12 animate-in fade-in duration-700 bg-[#020617] text-white font-sans selection:bg-emerald-500/30">

            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-white/5 pb-8">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 bg-emerald-500/10 rounded-3xl flex items-center justify-center border border-emerald-500/20 shadow-[0_0_40px_rgba(16,185,129,0.1)]">
                        <DollarSign size={40} className="text-emerald-500" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black italic uppercase tracking-tighter">Checkout Hub</h1>
                        <p className="text-slate-400 font-medium mt-1 flex items-center gap-2">
                            <ShieldCheck size={16} className="text-emerald-500" />
                            Ambiente Seguro de Gestão Financeira
                        </p>
                    </div>
                </div>

                <div className={`px-4 py-2 rounded-full border text-xs font-black uppercase tracking-widest flex items-center gap-2 ${active ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-500'}`}>
                    <div className={`w-2 h-2 rounded-full ${active ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
                    {active ? 'Gateway Online' : 'Gateway Pausado'}
                </div>
            </div>

            {msg && (
                <div className={`p-4 rounded-2xl border flex items-center gap-3 ${msg.type === 'success' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-red-500/10 border-red-500/20 text-red-400'}`}>
                    {msg.type === 'success' ? <CheckCircle2 size={20} /> : <Ban size={20} />}
                    <span className="font-bold">{msg.text}</span>
                </div>
            )}

            {/* Config & Gateway Combined Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* 1. Global Status & Pricing */}
                <div className="space-y-6">
                    <div className="bg-slate-900/40 border border-white/5 rounded-[32px] p-8 backdrop-blur-xl h-full flex flex-col justify-between">
                        <div>
                            <h3 className="text-xl font-black text-white italic uppercase mb-6 flex items-center gap-2">
                                <LayoutDashboard size={20} className="text-blue-500" /> Configuração Global
                            </h3>

                            <div className="space-y-6">
                                {/* Price */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Preço do Produto (Centavos)</label>
                                    <div className="relative group">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
                                        <input
                                            type="number"
                                            value={amount}
                                            onChange={(e) => setAmount(Number(e.target.value))}
                                            className="w-full bg-slate-950 border border-slate-800 rounded-2xl pl-10 pr-4 py-4 text-white font-mono font-bold focus:border-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <p className="text-right text-[10px] font-bold text-emerald-500 italic">
                                        = {formatCurrency(amount / 100)}
                                    </p>
                                </div>

                                {/* Active Toggle */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Status de Vendas</label>
                                    <button
                                        onClick={() => setActive(!active)}
                                        className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between group ${active ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-950 border-slate-800'}`}
                                    >
                                        <span className={`text-sm font-black uppercase italic ${active ? 'text-emerald-500' : 'text-slate-500'}`}>
                                            {active ? 'Vendas Liberadas' : 'Vendas Encerradas'}
                                        </span>
                                        <div className={`w-12 h-6 rounded-full relative transition-colors ${active ? 'bg-emerald-500' : 'bg-slate-700'}`}>
                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${active ? 'left-7' : 'left-1'}`} />
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. Gateway Integration (PixUP Styled) */}
                <div className="bg-slate-900/40 border border-white/5 rounded-[32px] p-8 backdrop-blur-xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />

                    <div className="relative">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                                    <Server size={24} className="text-white" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white italic uppercase">Serviço ativo: {gateway.toUpperCase()}</h3>
                                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                                        Endpoint: {gateway === 'pixup' ? 'api.pixupbr.com' : 'Gateway Padrao'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Security Warning */}
                        <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-xl mb-8 flex items-start gap-3">
                            <ShieldAlert className="text-amber-500 shrink-0 mt-0.5" size={18} />
                            <p className="text-[11px] text-amber-500 font-bold leading-relaxed">
                                Segurança: Suas credenciais são criptografadas e protegidas. <br />
                                Nunca compartilhe essas informações com terceiros não autorizados.
                            </p>
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                    <Activity size={12} /> Tipo de Serviço
                                </label>
                                <div className="relative">
                                    <select
                                        value={gateway}
                                        onChange={(e) => setGateway(e.target.value)}
                                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-4 text-white text-sm font-bold appearance-none hover:border-slate-700 focus:border-emerald-500 outline-none transition-colors cursor-pointer"
                                    >
                                        <option value="pixup">PixUP - api.pixupbr.com</option>
                                        <option value="stripe">Stripe Payments</option>
                                        <option value="asaas">Asaas (Brasil)</option>
                                        <option value="pagarme">Pagar.me</option>
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                                        <ArrowDownRight size={16} />
                                    </div>
                                </div>
                            </div>

                            {gateway === 'pixup' && (
                                <div className="space-y-4 animate-in slide-in-from-top-4 fade-in duration-300">
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                            <Lock size={12} /> Client ID
                                        </label>
                                        <input
                                            type="text"
                                            value={credentials.pixup_client_id || ''}
                                            onChange={(e) => updateCredential('pixup_client_id', e.target.value)}
                                            placeholder="Ex: Muzeira_9308..."
                                            className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white text-sm font-mono placeholder:text-slate-700 focus:border-emerald-500 outline-none transition-colors"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                            <Lock size={12} /> Client Secret
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showSecret ? "text" : "password"}
                                                value={credentials.pixup_client_secret || ''}
                                                onChange={(e) => updateCredential('pixup_client_secret', e.target.value)}
                                                placeholder="••••••••••••••••"
                                                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-4 pr-12 py-3 text-white text-sm font-mono placeholder:text-slate-700 focus:border-emerald-500 outline-none transition-colors"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowSecret(!showSecret)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-500 hover:text-white transition-colors"
                                            >
                                                {showSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-emerald-600/20 transition-all flex items-center justify-center gap-2 mt-4"
                            >
                                {saving ? 'Salvando...' : 'Salvar Credenciais'} <ShieldCheck size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transactions Table (Full Width) */}
            <div className="bg-slate-900/40 border border-white/5 rounded-[32px] p-8 backdrop-blur-xl min-h-[400px]">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="text-xl font-black text-white italic uppercase flex items-center gap-2">
                        <Activity size={20} className="text-orange-500" /> Transações Recentes
                    </h3>
                    <button onClick={loadData} className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                        <ArrowDownRight size={18} className="text-slate-500" />
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-white/5 text-left">
                                <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest pl-4">ID</th>
                                <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Valor</th>
                                <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Método</th>
                                <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Status</th>
                                <th className="pb-4 text-[10px] font-black text-slate-500 uppercase tracking-widest">Data</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {transactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-white/[0.02] transition-colors group">
                                    <td className="py-4 pl-4">
                                        <span className="text-[10px] font-mono text-slate-600 block w-20 truncate">{tx.id}</span>
                                    </td>
                                    <td className="py-4">
                                        <span className="text-sm font-black text-white italic">{formatCurrency(tx.amount)}</span>
                                    </td>
                                    <td className="py-4">
                                        <span className="text-[10px] font-black uppercase text-slate-500 bg-slate-950 px-2 py-1 rounded-lg border border-slate-800">
                                            {tx.method || 'PIX'}
                                        </span>
                                    </td>
                                    <td className="py-4">
                                        <span className={`text-[10px] font-black uppercase px-3 py-1.5 rounded-full border ${tx.status === 'paid'
                                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                            : tx.status === 'pending'
                                                ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                                                : 'bg-red-500/10 border-red-500/20 text-red-500'
                                            }`}>
                                            {tx.status}
                                        </span>
                                    </td>
                                    <td className="py-4">
                                        <span className="text-[10px] font-bold text-slate-600 uppercase">
                                            {formatDate(tx.createdAt || tx.created_at)}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {transactions.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="py-10 text-center text-slate-600 font-medium italic">
                                        Nenhuma transação encontrada recentamente.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
