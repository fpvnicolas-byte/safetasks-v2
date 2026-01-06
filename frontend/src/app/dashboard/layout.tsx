'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation'; // Importante: useRouter adicionado
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
  X
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { authApi, organizationsApi } from '../../../lib/api';
import { useDesignTokens } from '../../../lib/hooks/use-design-tokens';
import { AccessibilityPanel } from '../../components/dev/accessibility-panel';
import { SubscriptionGuard } from '../../components/SubscriptionGuard';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

interface OrganizationSettings {
  id: number;
  name: string;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  default_tax_rate: number;
  subscription_plan: string;
  subscription_status: string;
  trial_ends_at: string | null; // ISO string
  subscription_ends_at: string | null; // ISO string
  billing_id: string | null;
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
  const [organizationSettings, setOrganizationSettings] = useState<OrganizationSettings | null>(null);
  const [showTrialBanner, setShowTrialBanner] = useState(true);
  const pathname = usePathname();
  const router = useRouter(); // Importante: router inicializado aqui!

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

  // Filter navigation based on role
  const filteredNavigation = navigation.filter(item => {
    if (!user) return false;
    if (user.role === 'admin') return true;

    // Crew navigation whitelist
    return ['/dashboard', '/dashboard/productions', '/dashboard/calendar'].includes(item.href);
  });

  // Define routes that should show the privacy toggle button (pages with financial data)
  const financialRoutes = ['/dashboard', '/dashboard/productions', '/dashboard/services'];
  // Only show privacy button for admins on financial routes
  const shouldShowPrivacyButton = user?.role === 'admin' && financialRoutes.includes(pathname);

  useEffect(() => {
    const fetchUserAndOrgSettings = async () => {
      try {
        const userData = await authApi.getCurrentUser();
        setUser(userData);

        const orgSettings = await organizationsApi.getSettings();
        setOrganizationSettings(orgSettings);

        // Check if subscription was successful and show a toast
        const params = new URLSearchParams(window.location.search);
        if (params.get('subscription') === 'success') {
          toast.success("Assinatura realizada com sucesso! Bem-vindo ao seu novo plano.");
          // Limpa o URL: Usar window.history.replaceState para remover o parâmetro 'subscription' sem recarregar a página
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('subscription');
          window.history.replaceState({}, '', newUrl.toString()); // Sintaxe corrigida
        }

      } catch (error) {
        console.error('Failed to fetch user or organization settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndOrgSettings();
  }, [pathname, router]); // Adicionado router às dependências

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const trialDaysRemaining = useMemo(() => {
    if (organizationSettings && organizationSettings.subscription_status === 'trialing' && organizationSettings.trial_ends_at) {
      const trialEndDate = new Date(organizationSettings.trial_ends_at);
      const today = new Date();
      const diffTime = trialEndDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return diffDays > 0 ? diffDays : 0;
    }
    return null;
  }, [organizationSettings]);

  // Dynamic Background Orbs Configuration
  // Fixed: Moved before conditional returns to follow Rules of Hooks
  // Improved: Using explicit styles to ensure CSS transitions trigger reliably
  const orbStyles = useMemo(() => {
    console.log(`[DashboardLayout] Detecting route change: ${pathname}`);

    if (pathname.startsWith('/dashboard/productions')) {
      return {
        orb1: { top: '10%', left: '-10%', width: '900px', height: '900px', backgroundColor: 'rgba(37, 99, 235, 0.4)' },
        orb2: { bottom: '0%', right: '5%', width: '800px', height: '800px', backgroundColor: 'rgba(6, 182, 212, 0.3)' },
        orb3: { top: '40%', left: '20%', width: '600px', height: '600px', backgroundColor: 'rgba(79, 70, 229, 0.2)' },
      };
    }
    if (pathname.startsWith('/dashboard/calendar')) {
      return {
        orb1: { top: '-10%', left: '20%', width: '1000px', height: '1000px', backgroundColor: 'rgba(147, 51, 234, 0.4)' },
        orb2: { bottom: '-5%', right: '-5%', width: '900px', height: '900px', backgroundColor: 'rgba(236, 72, 153, 0.3)' },
        orb3: { top: '30%', left: '50%', width: '500px', height: '500px', backgroundColor: 'rgba(139, 92, 246, 0.2)' },
      };
    }
    if (pathname.startsWith('/dashboard/users')) {
      return {
        orb1: { top: '40%', left: '10%', width: '800px', height: '800px', backgroundColor: 'rgba(5, 150, 105, 0.4)' },
        orb2: { top: '-5%', right: '0%', width: '900px', height: '900px', backgroundColor: 'rgba(20, 184, 166, 0.3)' },
        orb3: { bottom: '10%', left: '30%', width: '600px', height: '600px', backgroundColor: 'rgba(34, 197, 94, 0.2)' },
      };
    }
    if (pathname.startsWith('/dashboard/settings')) {
      return {
        orb1: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: '1100px', height: '1100px', backgroundColor: 'rgba(71, 85, 105, 0.4)' },
        orb2: { top: '10%', left: '10%', width: '500px', height: '500px', backgroundColor: 'rgba(59, 130, 246, 0.2)' },
        orb3: { bottom: '10%', right: '10%', width: '500px', height: '500px', backgroundColor: 'rgba(16, 185, 129, 0.2)' },
      };
    }
    // Default (Dashboard / Resumo)
    return {
      orb1: { top: '0%', left: '15%', width: '900px', height: '900px', backgroundColor: 'rgba(16, 185, 129, 0.4)' },
      orb2: { bottom: '5%', right: '5%', width: '1000px', height: '1000px', backgroundColor: 'rgba(59, 130, 246, 0.3)' },
      orb3: { top: '40%', left: '40%', width: '700px', height: '700px', backgroundColor: 'rgba(234, 179, 8, 0.2)' },
    };
  }, [pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-slate-400">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex relative overflow-hidden bg-slate-950 text-slate-50">
      {/* Dynamic Background Orbs Layer */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(148,163,184,0.15) 1px, transparent 0)`,
            backgroundSize: '30px 30px'
          }} />
        </div>

        {/* The Orbs - Using style for guaranteed movement transition */}
        <div
          className="absolute rounded-full blur-[150px] animate-breathing"
          style={{
            ...orbStyles.orb1,
            transition: 'all 3s cubic-bezier(0.4, 0, 0.2, 1)',
            zIndex: 1
          }}
        />
        <div
          className="absolute rounded-full blur-[130px] animate-breathing"
          style={{
            ...orbStyles.orb2,
            transition: 'all 3s cubic-bezier(0.4, 0, 0.2, 1)',
            animationDelay: '2s',
            zIndex: 1
          }}
        />
        <div
          className="absolute rounded-full blur-[110px] animate-breathing"
          style={{
            ...orbStyles.orb3,
            transition: 'all 3s cubic-bezier(0.4, 0, 0.2, 1)',
            animationDelay: '4s',
            zIndex: 1
          }}
        />
      </div>

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
              {filteredNavigation.map((item) => {
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
                      >{item.name}</span>
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
        <SubscriptionGuard>
          {/* Trial Status Banner */}
          {showTrialBanner && trialDaysRemaining !== null && trialDaysRemaining > 0 && (
            <div
              className="bg-yellow-800/20 text-yellow-200 text-sm py-2 px-6 flex items-center justify-between"
              style={{
                borderBottom: `1px solid ${colors.glass.border}`,
              }}
            >
              <span>
                Seu período de teste termina em <strong className="font-bold">{trialDaysRemaining} {trialDaysRemaining === 1 ? "dia" : "dias"}</strong>.
                <Link href="/plans" className="ml-2 underline hover:no-underline font-medium">
                  Atualize seu plano agora!
                </Link>
              </span>
              <button onClick={() => setShowTrialBanner(false)} className="p-1 rounded-full hover:bg-yellow-700/30 transition-colors">
                <X className="h-4 w-4 text-yellow-200" />
              </button>
            </div>
          )}
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
        </SubscriptionGuard>
      </main>
    </div>
  );
}