'use client';

// Teste de commit - comentário adicionado para prática

import { useEffect, useRef } from 'react';
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
  Settings,
} from 'lucide-react';
import { useDesignTokens } from '../../lib/hooks/use-design-tokens';

interface User {
  id: number;
  email: string;
  full_name: string;
  role: string;
}

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  filteredNavigation: Array<{
    name: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
  }>;
  onLogout: () => void;
}

export function Sidebar({
  isOpen,
  onClose,
  user,
  filteredNavigation,
  onLogout,
}: SidebarProps) {
  const pathname = usePathname();
  const { colors, shadows, transitions, borderRadius, focusRing } = useDesignTokens();
  const sidebarRef = useRef<HTMLElement>(null);

  // Handler de logout - apenas executa logout, o redirecionamento cuida do resto
  const handleLogoutClick = async () => {
    try {
      await onLogout();
    } catch (error) {
      console.error("Erro ao deslogar:", error);
    }
  };

  // Função blindada para trigger de logout
  const triggerLogout = (e: React.MouseEvent | React.TouchEvent) => {
    e.preventDefault();
    e.stopPropagation();
    console.log("LOGOUT ACIONADO VIA", e.type);
    handleLogoutClick();
  };

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose]);

  return (
    <>
      {/* Sidebar Desktop - SEMPRE visível em lg */}
      <aside
        ref={sidebarRef}
        className="hidden lg:flex lg:flex-col lg:fixed lg:left-0 lg:top-0 lg:h-[100dvh] lg:w-64 lg:z-10 lg:overflow-y-auto"
        style={{
          backgroundColor: colors.glass.dark,
          backdropFilter: 'blur(12px)',
          borderRight: `1px solid ${colors.glass.border}`,
          boxShadow: shadows.glass.medium,
        }}
        aria-label="Navegação principal"
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
                      className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none"
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
                        className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-250 ease-in-out ${
                          isActive ? 'text-slate-50' : 'text-slate-400'
                        }`}
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
                  className="h-9 w-9 rounded-full flex items-center justify-center"
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
                    className="text-sm font-medium truncate max-w-[120px]"
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
                type="button"
                onClick={handleLogoutClick}
                className="p-3 rounded-lg transition-colors focus:outline-none hover:bg-white/5 active:bg-white/10"
                style={{
                  ...focusRing(colors.primary[500]),
                  borderRadius: borderRadius.md,
                }}
                title="Sair"
                aria-label="Fazer logout"
              >
                <LogOut 
                  className="h-5 w-5 text-slate-400 transition-colors hover:text-slate-200" 
                  aria-hidden="true" 
                />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Sidebar Mobile Drawer */}
      <aside
        ref={(el) => {
          // Use ref for mobile drawer too
          if (el && sidebarRef.current === undefined) {
            // Only set if not already set by desktop ref
          }
        }}
        className={`
          fixed left-0 top-0 h-[100dvh] w-64 z-50 overflow-y-auto
          bg-slate-950/95 backdrop-blur-2xl
          border-r border-white/10 shadow-2xl
          transition-transform duration-300 ease-in-out
          pb-24 md:pb-0  // Safe area para botões não ficarem escondidos na barra do OS
          
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
        aria-label="Menu de navegação"
      >
        <div className="flex flex-col h-full">
          {/* Header Mobile */}
          <header
            className="flex items-center justify-between px-6 py-4"
            style={{
              borderBottom: `1px solid ${colors.glass.border}`,
            }}
          >
            <div className="flex items-center">
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
            </div>
          </header>

          {/* Navigation Mobile */}
          <nav className="flex-1 px-4 py-6">
            <ul className="space-y-2" role="menubar">
              {filteredNavigation.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <li key={item.name} role="none">
                    <Link
                      href={item.href}
                      onClick={onClose}
                      className="group flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200 focus:outline-none"
                      style={{
                        ...focusRing(colors.primary[500]),
                        backgroundColor: isActive ? colors.glass.light : 'transparent',
                        color: isActive ? colors.slate[50] : colors.slate[400],
                        boxShadow: isActive ? shadows.glass.soft : 'none',
                        transition: transitions.normal,
                        borderRadius: borderRadius.xl,
                      }}
                      aria-current={isActive ? 'page' : undefined}
                      role="menuitem"
                    >
                      <Icon
                        className={`mr-3 h-5 w-5 flex-shrink-0 transition-colors duration-250 ease-in-out ${
                          isActive ? 'text-slate-50' : 'text-slate-400'
                        }`}
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

          {/* User section Mobile - com Safe Area para iOS/Android */}
          <div
            className="p-4 pb-8 mb-24 md:mb-0 z-[60] relative"
            style={{
              borderTop: `1px solid ${colors.glass.border}`,
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center"
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
                    className="text-sm font-medium truncate max-w-[120px]"
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
                type="button"
                onClick={triggerLogout}
                onTouchEnd={triggerLogout}
                className="w-full min-h-[50px] flex items-center justify-center gap-3 p-3 rounded-lg
                           active:scale-95 active:bg-white/10 transition-all cursor-pointer
                           hover:bg-white/5"
                style={{
                  ...focusRing(colors.primary[500]),
                  borderRadius: borderRadius.md,
                }}
                title="Sair"
                aria-label="Fazer logout"
              >
                <LogOut 
                  className="h-5 w-5 text-slate-400 transition-colors hover:text-slate-200" 
                  aria-hidden="true" 
                />
                <span className="text-sm font-medium text-slate-300">Sair</span>
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Overlay */}
      <div
        className={`
          fixed inset-0 z-40 bg-black/50 backdrop-blur-sm
          transition-opacity duration-300 ease-in-out
          ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}
        `}
        onClick={onClose}
        aria-hidden="true"
      />
    </>
  );
}

// Export navigation items as constant for reuse
export const navigationItems = [
  { name: 'Resumo', href: '/dashboard', icon: Home },
  { name: 'Produções', href: '/dashboard/productions', icon: Film },
  { name: 'Clientes', href: '/dashboard/clients', icon: Users },
  { name: 'Equipe', href: '/dashboard/users', icon: Users },
  { name: 'Serviços', href: '/dashboard/services', icon: Wrench },
  { name: 'Calendário', href: '/dashboard/calendar', icon: Calendar },
  { name: 'Configurações', href: '/dashboard/settings', icon: Settings },
];
