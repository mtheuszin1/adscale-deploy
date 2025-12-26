import React, { useState, useEffect } from 'react';
import { Search, MoreVertical, Filter, UserCheck, UserX, Crown, Loader2 } from 'lucide-react';
import { api } from '../services/api';
import { User as UserType } from '../types';

const UsersPage: React.FC = () => {
  const [users, setUsers] = useState<UserType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const data = await api.getUsers();
        setUsers(data);
      } catch (e: any) {
        setError(e.message || 'Erro ao carregar usuários');
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-10">
        <div>
          <h1 className="text-5xl font-black tracking-tighter mb-3 uppercase italic">Operadores de Rede</h1>
          <p className="text-slate-500 font-medium text-lg">Controle de acesso, privilégios e status de assinatura.</p>
        </div>
        <div className="flex gap-4">
          <button className="bg-slate-900 border border-slate-800 px-6 py-3 rounded-2xl flex items-center gap-3 hover:bg-slate-800 transition-all font-bold text-xs uppercase tracking-widest text-slate-400">
            <Filter size={18} /> Filtrar Agentes
          </button>
          <button className="bg-blue-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-500 shadow-xl shadow-blue-600/20 transition-all italic">
            Exportar Protocolo (CSV)
          </button>
        </div>
      </header>

      <div className="relative group">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
        <input
          type="text"
          placeholder="Localizar operador por codinome ou canal seguro..."
          className="w-full bg-slate-900/60 border border-slate-800 rounded-3xl py-5 pl-16 pr-6 focus:border-blue-500 outline-none transition-all placeholder:text-slate-700 font-bold text-sm text-white"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-slate-900/40 border border-slate-800 rounded-[48px] overflow-hidden backdrop-blur-md shadow-2xl min-h-[400px]">
        {loading ? (
          <div className="flex flex-col items-center justify-center p-20 gap-4">
            <Loader2 className="text-blue-500 animate-spin" size={48} />
            <p className="text-slate-500 font-black uppercase tracking-[0.3em] text-[10px]">Acessando registros criptografados...</p>
          </div>
        ) : error ? (
          <div className="p-20 text-center text-rose-500 font-black uppercase tracking-widest text-xs">
            {error}
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-black/40 border-b border-slate-800">
              <tr>
                <th className="px-10 py-6 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Operador</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Status Vital</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Protocolo</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em]">Data Ingresso</th>
                <th className="px-10 py-6 text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] text-right">Controles</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {filteredUsers.map(u => (
                <tr key={u.id} className="hover:bg-blue-600/[0.02] transition-all group">
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-5">
                      <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center font-black text-slate-600 group-hover:border-blue-500/50 group-hover:text-blue-500 transition-all text-lg italic uppercase">
                        {u.name.charAt(0)}
                      </div>
                      <div>
                        <div className="text-sm font-black text-white flex items-center gap-2 uppercase italic tracking-tight">
                          {u.name}
                          {u.role.toLowerCase() === 'admin' && <Crown size={14} className="text-amber-500" />}
                        </div>
                        <div className="text-[11px] font-bold text-slate-600 font-mono tracking-tighter">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-6">
                    <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border ${u.subscriptionActive ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20' : 'bg-red-500/5 text-red-500 border-red-500/20'
                      }`}>
                      {u.subscriptionActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-10 py-6">
                    <span className="text-xs font-black text-slate-300 uppercase tracking-widest">{u.subscriptionPlan || 'Nenhum'}</span>
                  </td>
                  <td className="px-10 py-6">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString('pt-BR') : 'Sem data'}
                    </span>
                  </td>
                  <td className="px-10 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-3 bg-white/5 text-slate-600 hover:text-emerald-500 hover:bg-emerald-500/10 rounded-xl transition-all" title="Liberar Acesso"><UserCheck size={18} /></button>
                      <button className="p-3 bg-white/5 text-slate-600 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all" title="Interromper"><UserX size={18} /></button>
                      <button className="p-3 bg-white/5 text-slate-600 hover:text-white rounded-xl transition-all"><MoreVertical size={18} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-10 py-20 text-center text-slate-600 font-bold uppercase tracking-widest text-[10px]">
                    Nenhum operador encontrado na base de dados.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default UsersPage;
