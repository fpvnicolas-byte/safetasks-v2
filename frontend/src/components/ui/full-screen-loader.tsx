'use client';

import { Film } from 'lucide-react';

export function FullScreenLoader() {
  return (
    <div className="h-screen w-full flex items-center justify-center bg-slate-950">
      <div className="flex flex-col items-center gap-4">
        <div className="relative">
          {/* Pulsing Logo */}
          <Film 
            className="w-16 h-16 text-emerald-400 animate-pulse" 
            style={{ filter: 'drop-shadow(0 0 20px rgba(52, 211, 153, 0.5))' }}
          />
          {/* Subtle ring effect */}
          <div className="absolute inset-0 rounded-full border-2 border-emerald-400/20 animate-ping" style={{ animationDuration: '2s' }} />
        </div>
        {/* NO TEXT - just the breathing logo */}
      </div>
    </div>
  );
}
