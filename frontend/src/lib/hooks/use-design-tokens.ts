'use client';

import { useMemo } from 'react';
import {
  colors,
  spacing,
  typography,
  shadows,
  borderRadius,
  transitions,
  glassEffect,
  withOpacity,
  focusRing
} from '../design-tokens';

/**
 * Hook para acessar design tokens de forma tipada e consistente
 */
export function useDesignTokens() {
  return useMemo(() => ({
    colors,
    spacing,
    typography,
    shadows,
    borderRadius,
    transitions,

    // Utilitários
    glassEffect,
    withOpacity,
    focusRing,

    // Classes CSS comuns
    commonClasses: {
      // Glass card
      glassCard: {
        backgroundColor: colors.glass.medium,
        backdropFilter: 'blur(12px)',
        border: `1px solid ${colors.glass.border}`,
        borderRadius: borderRadius.xl,
        boxShadow: shadows.glass.medium,
      },

      // Focus ring acessível
      focusRing: {
        outline: 'none',
        boxShadow: `0 0 0 2px ${colors.primary[500]}`,
      },

      // Transições suaves
      smoothTransition: {
        transition: transitions.normal,
      },

      // Tipografia padrão
      heading: {
        fontFamily: typography.fontFamily.sans.join(', '),
        fontWeight: typography.fontWeight.semibold,
        color: colors.slate[50],
      },

      body: {
        fontFamily: typography.fontFamily.sans.join(', '),
        fontWeight: typography.fontWeight.normal,
        color: colors.slate[200],
      },
    },
  }), []);
}

