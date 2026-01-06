'use client';

import { useEffect, useState } from 'react';
import { useDesignTokens } from '../lib/hooks';
import { generateAccessibilityReport } from '../lib/accessibility-tests';

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
 * VERSÃO COMPLETA DO PAINEL DE ACESSIBILIDADE
 * Esta versão pode causar problemas de parsing - usar apenas quando necessário
 * Para uso em produção, manter a versão simplificada no arquivo principal
 */
export function AccessibilityPanel() {
  const [isVisible, setIsVisible] = useState(false);
  const [report, setReport] = useState<AccessibilityReport | null>(null);
  const { colors } = useDesignTokens();

  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const timer = setTimeout(() => {
        setIsVisible(true);
        const initialReport = generateAccessibilityReport();
        setReport(initialReport);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (isVisible) {
      const interval = setInterval(() => {
        const updatedReport = generateAccessibilityReport();
        setReport(updatedReport);
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [isVisible]);

  if (process.env.NODE_ENV !== 'development' || !isVisible) {
    return null;
  }

  return (
    <div
      className="fixed bottom-4 right-4 z-50 bg-slate-900/80 backdrop-blur-lg border border-white/10 rounded-lg p-4 shadow-xl max-w-xs text-slate-50"
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.8)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        color: '#f1f5f9',
      }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium">♿ Acessibilidade</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-slate-400 hover:text-slate-200 transition-colors"
          aria-label="Fechar painel de acessibilidade"
        >
          ✕
        </button>
      </div>

      {report ? (
        <div className="space-y-3">
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-400">Score Geral</span>
              <span
                className="text-sm font-mono font-bold"
                style={{
                  color: report.overallScore >= 90 ? colors.success?.[400] || '#10b981' :
                         report.overallScore >= 70 ? colors.warning?.[400] || '#f59e0b' :
                         colors.error?.[400] || '#ef4444'
                }}
              >
                {report.overallScore >= 90 ? '🟢' :
                 report.overallScore >= 70 ? '🟡' : '🔴'} {report.overallScore}%
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-red-500 via-yellow-500 to-green-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${report.overallScore}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-slate-400">WCAG AA</span>
              <div className="font-mono font-bold" style={{
                color: report.accessibility.score >= 90 ? colors.success?.[400] || '#10b981' :
                       report.accessibility.score >= 70 ? colors.warning?.[400] || '#f59e0b' :
                       colors.error?.[400] || '#ef4444'
              }}>
                {report.accessibility.score}%
              </div>
            </div>
            <div>
              <span className="text-slate-400">Design System</span>
              <div className="font-mono font-bold" style={{
                color: report.designSystem.isUsingDesignTokens ? colors.success?.[400] || '#10b981' :
                       colors.error?.[400] || '#ef4444'
              }}>
                {report.designSystem.isUsingDesignTokens ? '✅' : '❌'}
              </div>
            </div>
          </div>

          {report.accessibility.issues.length > 0 && (
            <div>
              <h4 className="text-xs text-slate-400 mb-2">Problemas ({report.accessibility.issues.length}):</h4>
              <div className="max-h-20 overflow-y-auto space-y-1">
                {report.accessibility.issues.slice(0, 3).map((issue, i) => (
                  <div key={i} className="text-xs bg-red-900/20 border border-red-500/20 rounded p-2">
                    <div className="font-medium text-red-400 mb-1">{issue.element}</div>
                    <div className="text-red-300">{issue.issues[0]}</div>
                  </div>
                ))}
                {report.accessibility.issues.length > 3 && (
                  <div className="text-xs text-slate-400">
                    ...e mais {report.accessibility.issues.length - 3} problemas
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="text-xs text-slate-400">
          Carregando relatório...
        </div>
      )}
    </div>
  );
}
