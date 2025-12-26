
import React from 'react';
import { LayoutDashboard, Library, ShieldCheck, Settings, LogOut, TrendingUp, Users, Heart, DollarSign } from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  onNavigate: (page: string) => void;
  currentPage: string;
  userRole?: string;
  onLogout: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onNavigate, currentPage, userRole, onLogout }) => {
  const menuItems = [
    { id: 'dashboard', label: 'INICIO', icon: <LayoutDashboard size={18} /> },
    { id: 'library', label: 'Biblioteca Ads', icon: <Library size={18} /> },
    { id: 'trending', label: 'Escalando Live', icon: <TrendingUp size={18} /> },
    { id: 'saved', label: 'Meus Favoritos', icon: <Heart size={18} /> }
  ];

  const adminItems = [
    { id: 'admin', label: 'Admin Hub', icon: <ShieldCheck size={18} /> },
    { id: 'admin-checkout', label: 'Checkout Hub', icon: <DollarSign size={18} /> },
    { id: 'users', label: 'Gestão Usuários', icon: <Users size={18} /> }
  ];

  return (
    <nav className="flex items-center gap-1">
      {menuItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all relative group h-10 ${currentPage === item.id
            ? 'bg-blue-600/10 text-blue-600 dark:text-blue-500 font-black border border-blue-500/10'
            : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
            }`}
        >
          <div className={`${currentPage === item.id ? 'text-blue-600 dark:text-blue-500' : 'text-slate-400 dark:text-slate-600 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
            {item.icon}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest italic hidden xl:block">{item.label}</span>
          {currentPage === item.id && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-500 rounded-full" />}
        </button>
      ))}

      <div className="w-px h-6 bg-slate-200 dark:bg-slate-800 mx-2" />

      {userRole === 'admin' && adminItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onNavigate(item.id)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all relative group h-10 ${currentPage === item.id
            ? 'bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-white font-black border border-slate-200 dark:border-slate-800 shadow-sm'
            : 'text-slate-400 dark:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-white'
            }`}
        >
          <div className={`${currentPage === item.id ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-700 group-hover:text-slate-900 dark:group-hover:text-white'}`}>
            {item.icon}
          </div>
          <span className="text-[10px] font-black uppercase tracking-widest italic hidden xl:block">{item.label}</span>
        </button>
      ))}
    </nav>
  );
};

export default Sidebar;
