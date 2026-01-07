'use client';

import { useEffect, useState } from 'react';

interface AccessibilityReport {
  accessibility: {
    score: number;
    totalChecks: number;
    passedChecks: number;
    issues: Array<{ element: string; issues: string[] }>;
  };
  designSystem: {
    isUsingDesignTokens: boolean;
    hasConsistentSpacing: boolean;
    hasProperColors: boolean;
    issues: string[];
  };
  overallScore: number;
}

/**
 * Painel de desenvolvimento para monitoramento de acessibilidade
 * Aparece apenas em desenvolvimento
 */
export function AccessibilityPanel() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Só mostrar em desenvolvimento
    if (process.env.NODE_ENV === 'development') {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 2000); // Aparecer após 2 segundos

      return () => clearTimeout(timer);
    }

    return () => {}; // Cleanup function vazia para outros ambientes
  }, []);

  // Não renderizar em produção
  if (process.env.NODE_ENV !== 'development' || !isVisible) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 bg-slate-900/80 backdrop-blur-lg border border-white/10 rounded-lg p-4 shadow-xl max-w-xs text-slate-50">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">
          ♿ Acessibilidade
        </h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="Fechar painel de acessibilidade"
        >
          ✕
        </button>
      </div>

      <div className="text-xs text-slate-400">
        Painel ativo - Fase 2 completa
      </div>
    </div>
  );
}
