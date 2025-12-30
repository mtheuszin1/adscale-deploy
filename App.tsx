
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import Library from './pages/Library';
import ScalingLive from './pages/ScalingLive';
import Favorites from './pages/Favorites';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import Users from './pages/Users';
import { AdminCheckoutHub } from './pages/AdminCheckoutHub';
import AuthPage from './components/AuthPage';
import PricingPage from './pages/PricingPage';
import AdModal from './components/AdModal';
import { Ad, User } from './types';
import { dbService } from './services/dbService';
import { authService } from './services/authService';
import { Crown, Settings as SettingsIcon, LogOut, Moon, Sun, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [selectedAd, setSelectedAd] = useState<Ad | null>(null);
  const [theme] = useState<'light'>('light');

  const loadAds = async () => {
    try {
      const data = await dbService.getAds();
      setAds(data);
    } catch (e) {
      console.error(e);
    }
  };

  const checkAuth = async () => {
    const currentUser = await authService.getCurrentUser();
    setUser(currentUser);
  }

  useEffect(() => {
    checkAuth();
    loadAds();

    const handleDbUpdate = () => {
      loadAds();
    };

    window.addEventListener('databaseUpdated', handleDbUpdate);

    return () => window.removeEventListener('databaseUpdated', handleDbUpdate);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    const body = window.document.body;
    root.classList.add('light');
    root.classList.remove('dark');
    body.classList.add('light');
    body.classList.remove('dark');
  }, []);


  const handleLogin = async (email: string, password: string, name?: string) => {
    try {
      let user: User;
      if (name) {
        console.log("[App] Attempting Registration for:", email);
        user = await authService.register(email, password, name);
      } else {
        console.log("[App] Attempting Login for:", email);
        user = await authService.login(email, password);
      }

      console.log("[App] Auth success! User role:", user.role);
      setUser(user);
    } catch (e: any) {
      console.error("[App] handleLogin FAILED:", e);
      throw e;
    }
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setCurrentPage('dashboard');
  };

  const toggleFavorite = (id: string) => {
    if (!user) return;
    const favorites = user.favorites.includes(id)
      ? user.favorites.filter(favId => favId !== id)
      : [...user.favorites, id];

    const updatedUser = { ...user, favorites };
    setUser(updatedUser);
    localStorage.setItem('adscale_user', JSON.stringify(updatedUser));
  };

  const handleSubscribe = () => {
    // Navigate to pricing page instead of local mock
    setCurrentPage('pricing');
  };

  // If loading user (optional state), we could show a loader. 
  // For now, if no user and no token, show auth.
  // Guest Access Logic
  const hasAccess = user?.subscriptionActive || user?.role === 'admin';

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            ads={ads}
            onAdClick={setSelectedAd}
            onNavigate={setCurrentPage}
            isSubscribed={hasAccess}
          />
        );
      case 'library':
        return (
          <Library
            ads={ads}
            onAdClick={setSelectedAd}
            favorites={user?.favorites || []}
            onToggleFavorite={user ? toggleFavorite : () => setCurrentPage('auth')}
            isSubscribed={hasAccess}
            onNavigate={setCurrentPage}
          />
        );
      case 'trending':
        return user ? (
          <ScalingLive
            ads={ads}
            onAdClick={setSelectedAd}
            favorites={user?.favorites || []}
            onToggleFavorite={toggleFavorite}
            isSubscribed={hasAccess}
          />
        ) : <AuthPage onLogin={handleLogin} />;
      case 'saved':
        return user ? (
          <Favorites
            ads={ads}
            user={user}
            onAdClick={setSelectedAd}
            onToggleFavorite={toggleFavorite}
            isSubscribed={hasAccess}
          />
        ) : <AuthPage onLogin={handleLogin} />;
      case 'settings':
        return user ? <Settings user={user} /> : <AuthPage onLogin={handleLogin} />;
      case 'admin':
        return user?.role === 'admin' ? (
          <Admin
            ads={ads}
            onAddAd={(ad) => dbService.addAd(ad)}
            onDeleteAd={(id) => dbService.deleteAd(id)}
          />
        ) : (user ? <Dashboard ads={ads} onAdClick={setSelectedAd} onNavigate={setCurrentPage} /> : <AuthPage onLogin={handleLogin} />);
      case 'admin-checkout':
        return user?.role === 'admin' ? <AdminCheckoutHub /> : null;
      case 'users':
        return user?.role === 'admin' ? <Users /> : null;
      case 'pricing':
        return <PricingPage onSubscribe={handleSubscribe} />;
      case 'auth':
        return <AuthPage onLogin={handleLogin} />;
      default:
        return <Library ads={ads} onAdClick={setSelectedAd} favorites={user?.favorites || []} onToggleFavorite={user ? toggleFavorite : () => setCurrentPage('auth')} isSubscribed={hasAccess} onNavigate={setCurrentPage} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-blue-600/30 selection:text-blue-200 transition-theme">
      <header className="fixed top-0 left-0 right-0 h-20 bg-white/80 backdrop-blur-2xl z-50 border-b border-slate-200 flex items-center justify-between px-8 md:px-12 transition-theme">
        <div className="flex items-center gap-6 lg:gap-12">
          <div className="flex items-center gap-3">
            <div
              onClick={() => setCurrentPage('dashboard')}
              className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center cursor-pointer hover:rotate-6 transition-all shadow-xl shadow-blue-600/20"
            >
              <Zap size={24} className="text-white" fill="currentColor" />
            </div>
            <div
              onClick={() => setCurrentPage('dashboard')}
              className="flex flex-col cursor-pointer"
            >
              <span className="ml-3 text-lg font-black tracking-tighter text-slate-900 uppercase italic hidden lg:block">ADSRADAR</span>
            </div>
          </div>

          <div className="hidden md:block">
            <Sidebar
              isOpen={true}
              onNavigate={setCurrentPage}
              currentPage={currentPage}
              userRole={user?.role || 'user'}
              onLogout={handleLogout}
            />
          </div>
        </div>

        <div className="flex items-center gap-4 lg:gap-6">
          {/* Theme toggle removed to maintain premium dark aesthetic */}

          {!hasAccess && (
            <button onClick={() => setCurrentPage('pricing')} className="hidden sm:flex items-center gap-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest italic shadow-lg shadow-emerald-500/20 transition-all active:scale-95">
              <Crown size={14} /> Upgrade Pro
            </button>
          )}

          <div className="h-8 w-px bg-slate-200 hidden sm:block" />

          <div className="flex items-center gap-3">
            {user ? (
              <>
                <div className="flex flex-col items-end hidden sm:block">
                  <p className="text-[10px] font-black uppercase tracking-widest text-slate-900 leading-none mb-1">{user.name}</p>
                  <p className="text-[8px] font-black uppercase text-slate-500 leading-none">{user.role}</p>
                </div>

                <div className="relative group">
                  <div className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-xl flex items-center justify-center font-black text-xs italic text-blue-500 cursor-pointer hover:border-blue-500/50 transition-all">
                    {user.name.charAt(0)}
                  </div>

                  <div className="absolute right-0 top-full pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                    <div className="w-48 bg-white border border-slate-200 rounded-2xl p-2 shadow-2xl">
                      <button onClick={() => setCurrentPage('settings')} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all text-[10px] font-black uppercase tracking-widest italic">
                        <SettingsIcon size={14} /> Configurações
                      </button>
                      <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-rose-500 hover:bg-rose-50 transition-all text-[10px] font-black uppercase tracking-widest italic">
                        <LogOut size={14} /> Sair da Rede
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <button onClick={() => setCurrentPage('auth')} className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest italic shadow-lg shadow-blue-600/20 transition-all active:scale-95">
                Entrar
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="pt-32 pb-20 px-6 md:px-12">
        <div className="max-w-[1700px] mx-auto">
          {renderPage()}
        </div>
      </main>

      {selectedAd && (
        <AdModal
          ad={selectedAd}
          onClose={() => setSelectedAd(null)}
          onNextAd={() => {
            const idx = ads.findIndex(a => a.id === selectedAd.id);
            if (idx !== -1) setSelectedAd(ads[(idx + 1) % ads.length]);
          }}
          onPrevAd={() => {
            const idx = ads.findIndex(a => a.id === selectedAd.id);
            if (idx !== -1) setSelectedAd(ads[(idx - 1 + ads.length) % ads.length]);
          }}
          isSubscribed={hasAccess}
          onUpgrade={() => {
            setSelectedAd(null);
            setCurrentPage('pricing');
          }}
        />
      )}
    </div>
  );
};

export default App;
