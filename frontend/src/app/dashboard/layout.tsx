'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  Calendar,
  Film,
  Home,
  LogOut,
  Users,
  Wrench,
  Eye,
  EyeOff,
  Settings,
} from 'lucide-react';
import { Toaster } from 'sonner';
import { authApi } from '@/lib/api';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

const navigation = [
  { name: 'Resumo', href: '/dashboard', icon: Home },
  { name: 'Produções', href: '/dashboard/productions', icon: Film },
  { name: 'Clientes', href: '/dashboard/clients', icon: Users },
  { name: 'Equipe', href: '/dashboard/users', icon: Users },
  { name: 'Serviços', href: '/dashboard/services', icon: Wrench },
  { name: 'Calendário', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Configurações', href: '/dashboard/settings', icon: Settings },
];

// Privacy Context
interface PrivacyContextType {
  privacyMode: boolean;
  setPrivacyMode: (mode: boolean) => void;
}

const PrivacyContext = createContext<PrivacyContextType | undefined>(undefined);

export const usePrivacy = () => {
  const context = useContext(PrivacyContext);
  if (!context) {
    throw new Error('usePrivacy must be used within a PrivacyProvider');
  }
  return context;
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [privacyMode, setPrivacyMode] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await authApi.getCurrentUser();
        setUser(userData);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex relative overflow-hidden">
      {/* Background Pattern and Light Effects */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Subtle dot pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(148,163,184,0.15) 1px, transparent 0)`,
            backgroundSize: '20px 20px'
          }} />
        </div>

        {/* Light orbs */}
        <div className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-emerald-500/20 blur-[120px] -z-10 animate-pulse" />
        <div className="absolute top-1/2 right-1/4 w-80 h-80 rounded-full bg-blue-500/15 blur-[100px] -z-10 animate-pulse" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-1/4 left-1/2 w-64 h-64 rounded-full bg-purple-500/10 blur-[80px] -z-10 animate-pulse" style={{ animationDelay: '2s' }} />

        {/* Additional ambient lights */}
        <div className="absolute top-1/6 right-1/6 w-32 h-32 rounded-full bg-cyan-500/10 blur-[60px] -z-10" />
        <div className="absolute bottom-1/6 left-1/6 w-40 h-40 rounded-full bg-pink-500/8 blur-[70px] -z-10" />
      </div>

      {/* Sidebar */}
      <div className="w-64 bg-slate-950/40 backdrop-blur-md border-r border-white/10 relative z-10">
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center px-6 py-4 border-b border-white/10">
            <Film className="h-8 w-8 text-slate-400" />
            <span className="ml-2 text-xl font-bold text-slate-200">
              SafeTasks
            </span>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6">
            <ul className="space-y-2">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <li key={item.name}>
                    <Link
                      href={item.href}
                      className={`
                        group flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200
                        ${
                          isActive
                            ? 'bg-white/10 text-slate-50 shadow-lg'
                            : 'text-slate-400 hover:text-slate-50 hover:bg-white/5'
                        }
                      `}
                    >
                      <Icon className="mr-3 h-5 w-5 flex-shrink-0" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User section */}
          <div className="border-t border-white/10 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="h-8 w-8 bg-white/10 rounded-full flex items-center justify-center">
                  <span className="text-sm font-medium text-slate-300">
                    {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-slate-200">
                    {user?.full_name || 'Usuário'}
                  </p>
                  <p className="text-xs text-slate-400 capitalize">
                    {user?.role === 'admin' ? 'Administrador' : 'Colaborador'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-slate-950/40 backdrop-blur-xl border-b border-white/10 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-200">
                {navigation.find(item => item.href === pathname)?.name || 'Dashboard'}
              </h1>
              <p className="text-sm text-slate-400 mt-1">
                Bem-vindo de volta, {user?.full_name?.split(' ')[0] || 'usuário'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setPrivacyMode(!privacyMode)}
                className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
                title={privacyMode ? 'Desativar modo privacidade' : 'Ativar modo privacidade'}
              >
                {privacyMode ? (
                  <EyeOff className="h-5 w-5 text-slate-400" />
                ) : (
                  <Eye className="h-5 w-5 text-slate-400" />
                )}
              </button>
              <div className="text-right">
                <p className="text-sm text-slate-400">
                  {new Date().toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <PrivacyContext.Provider value={{ privacyMode, setPrivacyMode }}>
          <main className="flex-1 overflow-auto">
            {children}
          </main>
        </PrivacyContext.Provider>

        {/* Toast Notifications */}
        <Toaster
          position="bottom-center"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'rgba(15, 23, 42, 0.8)',
              backdropFilter: 'blur(12px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#f1f5f9',
              fontSize: '14px',
              fontWeight: '500',
            },
            className: 'border border-white/10',
          }}
        />
      </div>
    </div>
  );
}
