import React, { useState, useEffect } from 'react';
import { Mail, Lock, User, ArrowRight, Github, Chrome, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface AuthPageProps {
  onLogin: (email: string, password: string, name?: string) => Promise<void>;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [backendAlive, setBackendAlive] = useState(true);

  useEffect(() => {
    const check = async () => {
      const alive = await api.checkHealth();
      setBackendAlive(alive);
    };
    check();
    const interval = setInterval(check, 5000);
    return () => clearInterval(interval);
  }, []);


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("[AuthPage] Submitting form. isLogin:", isLogin, "email:", email);
    setError('');
    setLoading(true);
    try {
      if (isLogin) {
        console.log("[AuthPage] Calling onLogin with credentials...");
        await onLogin(email, password);
        console.log("[AuthPage] onLogin successful!");
      } else {
        console.log("[AuthPage] Calling onLogin with registration data...");
        await onLogin(email, password, name);
        console.log("[AuthPage] Registration/Login successful!");
      }
    } catch (e: any) {
      console.error("[AuthPage] Error during auth:", e);
      let msg = e.message || "Erro na autenticação.";
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError")) {
        msg = "Falha de conexão com o servidor. Verifique se o backend está online.";
      }
      setError(msg);
    } finally {
      setLoading(false);
      console.log("[AuthPage] Submit process finished. loading set to false.");
    }
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-indigo-600/10 blur-[120px] rounded-full" />

      <div className="w-full max-w-md relative z-10">
        <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 p-10 rounded-[32px] shadow-2xl">
          <div className="text-center mb-10">
            <div className="inline-flex w-12 h-12 bg-blue-600 rounded-2xl items-center justify-center font-black text-xl mb-4 shadow-lg shadow-blue-600/20 italic">AS</div>
            <h1 className="text-3xl font-black tracking-tighter text-white mb-2 uppercase italic">
              {isLogin ? 'Identificação' : 'Recrutamento'}
            </h1>
            <p className="text-slate-500 text-sm font-medium">
              Acesse o maior hub de inteligência de ads do país.
            </p>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-500 p-4 rounded-xl text-xs font-bold mb-6 text-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input
                  type="text"
                  placeholder="Seu nome completo"
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-blue-500 outline-none transition-all"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="email"
                placeholder="E-mail"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-blue-500 outline-none transition-all"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
              <input
                type="password"
                placeholder="Senha"
                className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white focus:border-blue-500 outline-none transition-all"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:bg-blue-600'} bg-white text-slate-950 font-black py-4 rounded-2xl flex items-center justify-center gap-3 transition-all shadow-lg active:scale-95 uppercase text-xs tracking-widest`}
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} /> Processando...
                </>
              ) : (
                <>
                  {isLogin ? 'Acessar Base' : 'Iniciar Protocolo'}
                  <ArrowRight size={18} />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 mt-4">
              <div className={`w-2 h-2 rounded-full ${backendAlive ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`} />
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-600">
                Sistema: {backendAlive ? 'Online' : 'Conectando ao Servidor...'}
              </span>
            </div>
          </form>

          <div className="mt-8 flex items-center gap-4 text-slate-800">
            <div className="h-px flex-1 bg-slate-800" />
            <span className="text-[10px] uppercase font-black tracking-[0.2em] text-slate-600">Integrar via</span>
            <div className="h-px flex-1 bg-slate-800" />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <button className="flex items-center justify-center gap-2 bg-slate-950 border border-slate-800 py-3 rounded-xl hover:bg-slate-900 transition-all text-sm font-bold text-slate-400">
              <Chrome size={18} /> Google
            </button>
            <button className="flex items-center justify-center gap-2 bg-slate-950 border border-slate-800 py-3 rounded-xl hover:bg-slate-900 transition-all text-sm font-bold text-slate-400">
              <Github size={18} /> Github
            </button>
          </div>

          <p className="text-center mt-10 text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            {isLogin ? 'Novo por aqui?' : 'Já é membro?'}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-blue-500 font-black ml-2 hover:underline"
            >
              {isLogin ? 'Criar Conta' : 'Fazer Login'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
