'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Calendar,
  Film,
  Home,
  Users,
  Wrench,
  Eye,
  EyeOff,
  Settings,
  X
} from 'lucide-react';
import { Toaster, toast } from 'sonner';
import { authApi, organizationsApi, supabaseAuthApi } from '../../lib/api';
import { useDesignTokens } from '../../lib/hooks/use-design-tokens';
import { AccessibilityPanel } from '../../components/dev/accessibility-panel';
import { SubscriptionGuard } from '../../components/SubscriptionGuard';
import { usePrivacy, PrivacyContext } from '../../hooks/use-privacy';
import { Sidebar, navigationItems } from '../../components/layout/Sidebar';
import { MobileHeader } from '../../components/layout/MobileHeader';
import { FullScreenLoader } from '../../components/ui/full-screen-loader';

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
  trial_ends_at: string | null;
  subscription_ends_at: string | null;
  billing_id: string | null;
}

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  const {
    colors,
    shadows,
    transitions,
    borderRadius,
    focusRing
  } = useDesignTokens();

  // Filter navigation based on role
  const filteredNavigation = useMemo(() => {
    return navigationItems.filter(item => {
      if (!user) return false;
      if (user.role === 'admin') return true;
      return ['/dashboard', '/dashboard/productions', '/dashboard/calendar'].includes(item.href);
    });
  }, [user]);

  const financialRoutes = ['/dashboard', '/dashboard/productions', '/dashboard/services'];
  const shouldShowPrivacyButton = user?.role === 'admin' && financialRoutes.includes(pathname);

  useEffect(() => {
    const fetchUserAndOrgSettings = async () => {
      try {
        const userData = await authApi.getCurrentUser();
        setUser(userData);

        const orgSettings = await organizationsApi.getSettings();
        setOrganizationSettings(orgSettings);

        const params = new URLSearchParams(window.location.search);
        if (params.get('subscription') === 'success') {
          toast.success("Assinatura realizada com sucesso! Bem-vindo ao seu novo plano.");
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.delete('subscription');
          window.history.replaceState({}, '', newUrl.toString());
        }
      } catch (error) {
        console.error('Failed to fetch user or organization settings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserAndOrgSettings();
  }, [pathname, router]);

  const handleLogout = async () => {
    try {
      // 1. Fazer logout do Supabase primeiro (remove sessão)
      await supabaseAuthApi.logout();

      // 2. Limpar dados do localStorage
      localStorage.removeItem('token');

      // 3. Limpar cache do navegador (service workers, cache storage)
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        );
      }

      // 4. Limpar sessionStorage se existir
      sessionStorage.clear();

      // 5. Pequeno delay para garantir que tudo foi limpo
      await new Promise(resolve => setTimeout(resolve, 100));

      // 6. Forçar refresh completo da página para limpar qualquer estado residual
      window.location.href = '/login';
    } catch (error) {
      console.error('Erro durante logout:', error);
      // Fallback: tentar limpar mesmo com erro
      try {
        localStorage.removeItem('token');
        sessionStorage.clear();
      } catch (fallbackError) {
        console.error('Erro no fallback de limpeza:', fallbackError);
      }
      window.location.href = '/login';
    }
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

  const orbStyles = useMemo(() => {
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
    return {
      orb1: { top: '0%', left: '15%', width: '900px', height: '900px', backgroundColor: 'rgba(16, 185, 129, 0.4)' },
      orb2: { bottom: '5%', right: '5%', width: '1000px', height: '1000px', backgroundColor: 'rgba(59, 130, 246, 0.3)' },
      orb3: { top: '40%', left: '40%', width: '700px', height: '700px', backgroundColor: 'rgba(234, 179, 8, 0.2)' },
    };
  }, [pathname]);

  if (loading) {
    return <FullScreenLoader />;
  }

  return (
    <div className="min-h-screen relative bg-slate-950 text-slate-50">
      {/* Dynamic Background Orbs Layer */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, rgba(148,163,184,0.15) 1px, transparent 0)`,
            backgroundSize: '30px 30px'
          }} />
        </div>

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
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 z-[100] px-4 py-2 rounded-md font-medium transition-all duration-200"
        style={{
          backgroundColor: colors.primary[500],
          color: colors.slate[50],
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        Pular para conteúdo principal
      </a>

      {/* Sidebar - Desktop (fixed) / Mobile (drawer) */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        user={user}
        filteredNavigation={filteredNavigation}
        onLogout={handleLogout}
      />

      {/* Mobile Header */}
      <MobileHeader onOpenSidebar={() => setSidebarOpen(true)} />

      {/* Main content */}
      <main
        id="main-content"
        className="flex-1 flex flex-col min-h-screen md:pl-[280px]"
      >
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

          {/* Dashboard Header */}
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
                  className="text-xl sm:text-2xl font-bold"
                  style={{
                    color: colors.slate[200],
                    fontFamily: 'Inter, system-ui, sans-serif',
                  }}
                >
                  {navigationItems.find(item => item.href === pathname)?.name || 'Dashboard'}
                </h1>
                <p
                  className="text-sm mt-1 hidden sm:block"
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
                <div className="text-right hidden sm:block">
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
