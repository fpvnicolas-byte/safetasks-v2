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
import { useDesignTokens } from '@/lib/hooks/use-design-tokens';
import { AccessibilityPanel } from '@/components/dev/accessibility-panel';

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

  // Design tokens para consistência visual
  const {
    colors,
    spacing,
    borderRadius,
    shadows,
    transitions,
    glassEffect,
    focusRing
  } = useDesignTokens();

  // Temporariamente removido skip links para resolver problemas de parsing

  // Define routes that should show the privacy toggle button (pages with financial data)
  const financialRoutes = ['/dashboard', '/dashboard/productions', '/dashboard/services'];
  const shouldShowPrivacyButton = financialRoutes.includes(pathname);

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
      {/* Skip Links para acessibilidade */}
      <a
        href="#navigation"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[100] px-4 py-2 rounded-md font-medium transition-all duration-200"
        style={{
          backgroundColor: colors.primary[500],
          color: colors.slate[50],
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        Pular para navegação
      </a>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-32 z-[100] px-4 py-2 rounded-md font-medium transition-all duration-200"
        style={{
          backgroundColor: colors.primary[500],
          color: colors.slate[50],
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        Pular para conteúdo principal
      </a>
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
        <div
          className="absolute top-1/4 left-1/3 w-96 h-96 rounded-full bg-emerald-500/20 blur-[120px] -z-10"
          style={{
            animation: 'smoothPulse 6s ease-in-out infinite',
            willChange: 'opacity, transform'
          }}
        />
        <div
          className="absolute top-1/2 right-1/4 w-80 h-80 rounded-full bg-blue-500/15 blur-[100px] -z-10"
          style={{
            animation: 'smoothPulse 6s ease-in-out infinite',
            animationDelay: '2s',
            willChange: 'opacity, transform'
          }}
        />
        <div
          className="absolute bottom-1/4 left-1/2 w-64 h-64 rounded-full bg-purple-500/10 blur-[80px] -z-10"
          style={{
            animation: 'smoothPulse 6s ease-in-out infinite',
            animationDelay: '4s',
            willChange: 'opacity, transform'
          }}
        />

        {/* Additional ambient lights */}
        <div className="absolute top-1/6 right-1/6 w-32 h-32 rounded-full bg-cyan-500/10 blur-[60px] -z-10" />
        <div className="absolute bottom-1/6 left-1/6 w-40 h-40 rounded-full bg-pink-500/8 blur-[70px] -z-10" />
      </div>

      {/* Sidebar */}
      <nav
        className="w-64 relative z-10"
        style={{
          backgroundColor: colors.glass.dark,
          backdropFilter: 'blur(12px)',
          borderRight: `1px solid ${colors.glass.border}`,
          boxShadow: shadows.glass.medium,
        }}
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <header
            className="flex items-center px-6 py-4"
            style={{
              borderBottom: `1px solid ${colors.glass.border}`,
            }}
          >
            <Film
              className="h-8 w-8"
              style={{ color: colors.slate[400] }}
              aria-hidden="true"
            />
            <span
              className="ml-2 text-xl font-bold"
              style={{
                color: colors.slate[200],
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            >
              SafeTasks
            </span>
          </header>

          {/* Navigation */}
          <nav id="navigation" className="flex-1 px-4 py-6">
            <ul className="space-y-2" role="menubar">
              {navigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <li key={item.name} role="none">
                    <Link
                      href={item.href}
                      className="group flex items-center px-3 py-2 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none"
                      style={{
                        ...focusRing(colors.primary[500]),
                        backgroundColor: isActive ? colors.glass.light : 'transparent',
                        color: isActive ? colors.slate[50] : colors.slate[400],
                        boxShadow: isActive ? shadows.glass.soft : 'none',
                        transition: transitions.normal,
                        borderRadius: borderRadius.xl,
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = colors.glass.light;
                          e.currentTarget.style.color = colors.slate[50];
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = colors.slate[400];
                        }
                      }}
                      aria-current={isActive ? 'page' : undefined}
                      role="menuitem"
                    >
                      <Icon
                        className="mr-3 h-5 w-5 flex-shrink-0"
                        style={{
                          color: isActive ? colors.slate[50] : colors.slate[400],
                          transition: transitions.normal,
                        }}
                        aria-hidden="true"
                      />
                      <span
                        style={{
                          color: isActive ? colors.slate[50] : colors.slate[400],
                          fontFamily: 'Inter, system-ui, sans-serif',
                          fontWeight: '500',
                          transition: transitions.normal,
                        }}
                      >
                        {item.name}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* User section */}
          <div
            className="p-4"
            style={{
              borderTop: `1px solid ${colors.glass.border}`,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div
                  className="h-8 w-8 rounded-full flex items-center justify-center"
                  style={{
                    backgroundColor: colors.glass.light,
                  }}
                >
                  <span
                    className="text-sm font-medium"
                    style={{
                      color: colors.slate[300],
                      fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                  >
                    {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="ml-3">
                  <p
                    className="text-sm font-medium"
                    style={{
                      color: colors.slate[200],
                      fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                  >
                    {user?.full_name || 'Usuário'}
                  </p>
                  <p
                    className="text-xs capitalize"
                    style={{
                      color: colors.slate[400],
                      fontFamily: 'Inter, system-ui, sans-serif',
                    }}
                  >
                    {user?.role === 'admin' ? 'Administrador' : 'Colaborador'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="p-1 rounded transition-colors focus:outline-none"
                style={{
                  ...focusRing(colors.primary[500]),
                  color: colors.slate[400],
                  transition: transitions.normal,
                  borderRadius: borderRadius.md,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = colors.slate[200];
                  e.currentTarget.style.backgroundColor = colors.glass.light;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = colors.slate[400];
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
                title="Sair"
                aria-label="Fazer logout"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main id="main-content" className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header
          className="px-6 py-4"
          style={{
            backgroundColor: colors.glass.medium,
            backdropFilter: 'blur(12px)',
            borderBottom: `1px solid ${colors.glass.border}`,
            boxShadow: shadows.glass.soft,
          }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h1
                className="text-2xl font-bold"
                style={{
                  color: colors.slate[200],
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                {navigation.find(item => item.href === pathname)?.name || 'Dashboard'}
              </h1>
              <p
                className="text-sm mt-1"
                style={{
                  color: colors.slate[400],
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}
              >
                Bem-vindo de volta, {user?.full_name?.split(' ')[0] || 'usuário'}
              </p>
            </div>
            <div className="flex items-center space-x-4">
              {shouldShowPrivacyButton && (
              <button
                onClick={() => setPrivacyMode(!privacyMode)}
                className="p-2 rounded-lg focus:outline-none"
                style={{
                  ...focusRing(colors.primary[500]),
                  backgroundColor: colors.glass.light,
                  transition: transitions.normal,
                  borderRadius: borderRadius.lg,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = colors.glass.medium;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = colors.glass.light;
                }}
                title={privacyMode ? 'Desativar modo privacidade' : 'Ativar modo privacidade'}
                aria-label={privacyMode ? 'Desativar modo privacidade' : 'Ativar modo privacidade'}
                aria-pressed={privacyMode}
              >
                {privacyMode ? (
                  <EyeOff
                    className="h-5 w-5"
                    style={{ color: colors.slate[400] }}
                    aria-hidden="true"
                  />
                ) : (
                  <Eye
                    className="h-5 w-5"
                    style={{ color: colors.slate[400] }}
                    aria-hidden="true"
                  />
                )}
              </button>
              )}
              <div className="text-right">
                <p
                  className="text-sm"
                  style={{
                    color: colors.slate[400],
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                >
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
          <div className="flex-1 overflow-auto">
            {children}
          </div>
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

      {/* Painel de Acessibilidade (apenas desenvolvimento) */}
      <AccessibilityPanel />
    </main>
  </div>
  );
}
