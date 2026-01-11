'use client';

import { Menu, Film } from 'lucide-react';
import Link from 'next/link';

interface MobileHeaderProps {
  onOpenSidebar: () => void;
}

export function MobileHeader({ onOpenSidebar }: MobileHeaderProps) {
  return (
    <header
      className="sticky top-0 z-30 block md:hidden"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.9)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
      }}
    >
      <div className="flex items-center justify-between px-4 py-3">
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center">
          <Film
            className="h-7 w-7"
            style={{ color: 'rgb(148, 163, 184)' }}
            aria-hidden="true"
          />
          <span
            className="ml-2 text-lg font-bold"
            style={{
              color: 'rgb(241, 245, 249)',
              fontFamily: 'Inter, system-ui, sans-serif',
            }}
          >
            SafeTasks
          </span>
        </Link>

        {/* Menu Button */}
        <button
          onClick={onOpenSidebar}
          className="p-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900"
          style={{
            backgroundColor: 'rgba(51, 65, 85, 0.5)',
            color: 'rgb(148, 163, 184)',
            transition: 'all 0.2s ease',
          }}
          aria-label="Abrir menu"
        >
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
      </div>
    </header>
  );
}
