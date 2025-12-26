
import React, { useState } from 'react';
import { Loader2, Globe, Check, AlertTriangle, Scan, X } from 'lucide-react';
import { api } from '../services/api';

interface ScannerModalProps {
    onClose: () => void;
    onScanComplete?: (data: any) => void;
}

const ScannerModal: React.FC<ScannerModalProps> = ({ onClose, onScanComplete }) => {
    const [url, setUrl] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState<any>(null);

    const handleScan = async () => {
        if (!url) return;
        setLoading(true);
        setError('');
        setResult(null);
        try {
            const data = await api.scanAd(url);
            setResult(data);
            if (onScanComplete) onScanComplete(data);
        } catch (e: any) {
            setError(e.message || 'Erro ao escanear URL.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-[#0f172a] border border-white/10 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300">

                {/* Header */}
                <div className="p-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-600/20 flex items-center justify-center text-blue-500">
                            <Scan size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-white italic uppercase tracking-tighter">Scanner IA</h3>
                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Interceptação de Dados em Tempo Real</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                        <X size={18} />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest pl-1">URL PARA ANÁLISE</label>
                        <div className="flex gap-2">
                            <div className="relative flex-1">
                                <Globe className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
                                <input
                                    type="text"
                                    placeholder="https://sualoja.com.br/produto..."
                                    className="w-full bg-[#161e2e] border border-white/5 rounded-xl py-3 pl-12 pr-4 text-xs font-bold text-white placeholder:text-slate-600 focus:outline-none focus:border-blue-500/50 transition-all"
                                    value={url}
                                    onChange={(e) => setUrl(e.target.value)}
                                />
                            </div>
                            <button
                                onClick={handleScan}
                                disabled={loading || !url}
                                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20"
                            >
                                {loading ? <Loader2 size={16} className="animate-spin" /> : 'ESCANEAR'}
                            </button>
                        </div>
                        {error && (
                            <div className="flex items-center gap-2 text-rose-500 bg-rose-500/10 p-3 rounded-lg border border-rose-500/20 mt-2">
                                <AlertTriangle size={14} />
                                <span className="text-[10px] font-bold uppercase">{error}</span>
                            </div>
                        )}
                    </div>

                    {/* Result Area */}
                    {result && (
                        <div className="bg-[#161e2e] rounded-2xl p-4 border border-white/5 space-y-4 animate-in slide-in-from-bottom-4">
                            <div className="flex items-start gap-4">
                                <div className="flex-1">
                                    <h4 className="text-white font-bold text-sm leading-tight mb-1">{result.title || 'Sem título detectado'}</h4>
                                    <p className="text-slate-500 text-[10px] line-clamp-2 leading-relaxed">{result.copy || 'Sem descrição detectada'}</p>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <div className="px-2 py-1 rounded-md bg-green-500/10 border border-green-500/20 text-green-500 text-[9px] font-black uppercase tracking-wider">
                                        {result.niche}
                                    </div>
                                    <div className="text-[9px] font-bold text-slate-600 uppercase">Score: {result.rating * 10}/10</div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-[#0f172a] p-3 rounded-xl border border-white/5">
                                    <span className="block text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">PLATAFORMA</span>
                                    <span className="text-xs font-bold text-blue-400 uppercase">{result.techStack?.platform || 'Desconhecida'}</span>
                                </div>
                                <div className="bg-[#0f172a] p-3 rounded-xl border border-white/5">
                                    <span className="block text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">TRÁFEGO EST.</span>
                                    <span className="text-xs font-bold text-blue-400 uppercase">{result.siteTraffic?.visitors?.toLocaleString()} /mês</span>
                                </div>
                            </div>

                            <div className="pt-2 flex justify-end">
                                <button className="text-[10px] font-black text-blue-500 uppercase hover:text-blue-400 transition-colors flex items-center gap-1">
                                    Ver Análise Completa <Check size={12} />
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ScannerModal;
