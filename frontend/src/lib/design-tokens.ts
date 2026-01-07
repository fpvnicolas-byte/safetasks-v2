/**
 * Design Tokens Centralizados - SafeTasks V2
 *
 * Sistema de design consistente para cores, espaçamentos, tipografia e outros tokens visuais.
 * Baseado no design "Liquid Glass" com tema dark profissional.
 */

// =============================================================================
// CORES - Liquid Glass Dark Theme
// =============================================================================

export const colors = {
  // Cores principais (Liquid Glass)
  primary: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    500: '#3b82f6',  // Azul principal
    600: '#2563eb',
    900: '#1e3a8a',
  },

  // Estados semânticos
  success: {
    400: '#4ade80',
    500: '#22c55e',  // Verde sucesso
    600: '#16a34a',
  },

  warning: {
    400: '#fbbf24',
    500: '#f59e0b',  // Âmbar warning
    600: '#d97706',
  },

  error: {
    400: '#f87171',
    500: '#ef4444',  // Vermelho erro
    600: '#dc2626',
  },

  // Escala de cinzas (Slate) - Liquid Glass
  slate: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',  // Fundo principal
    950: '#020617',  // Fundo escuro
  },

  // Glass effects (transparências)
  glass: {
    light: 'rgba(248, 250, 252, 0.1)',   // Texto claro em glass
    medium: 'rgba(15, 23, 42, 0.8)',     // Fundo glass médio
    dark: 'rgba(2, 6, 23, 0.95)',        // Fundo glass escuro
    border: 'rgba(255, 255, 255, 0.1)',  // Bordas glass
  },
} as const;

// =============================================================================
// ESPAÇAMENTOS - Sistema consistente
// =============================================================================

export const spacing = {
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
  '4xl': '6rem',   // 96px
} as const;

// =============================================================================
// TIPOGRAFIA - Hierarquia consistente
// =============================================================================

export const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
    mono: ['JetBrains Mono', 'SF Mono', 'Monaco', 'monospace'],
  },

  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }], // 36px
    '5xl': ['3rem', { lineHeight: '1' }],         // 48px
  },

  fontWeight: {
    thin: '100',
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    extrabold: '800',
    black: '900',
  },

  letterSpacing: {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
  },
} as const;

// =============================================================================
// SOMBRAS - Sistema de profundidade
// =============================================================================

export const shadows = {
  none: 'none',
  sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  xl: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',

  // Glass shadows (efeitos de profundidade)
  glass: {
    soft: 'inset 0 1px 0 rgb(255 255 255 / 0.1)',
    medium: '0 8px 32px rgb(0 0 0 / 0.3)',
    strong: '0 16px 64px rgb(0 0 0 / 0.4)',
  },
} as const;

// =============================================================================
// BORDAS - Sistema de formas
// =============================================================================

export const borderRadius = {
  none: '0',
  sm: '0.125rem',   // 2px
  md: '0.375rem',   // 6px
  lg: '0.5rem',     // 8px
  xl: '0.75rem',    // 12px
  '2xl': '1rem',    // 16px
  '3xl': '1.5rem',  // 24px
  full: '9999px',
} as const;

export const borderWidth = {
  0: '0',
  1: '1px',
  2: '2px',
  4: '4px',
  8: '8px',
} as const;

// =============================================================================
// ANIMAÇÕES - Transições consistentes
// =============================================================================

export const transitions = {
  fast: '150ms ease-in-out',
  normal: '250ms ease-in-out',
  slow: '350ms ease-in-out',

  // Easing functions
  easing: {
    linear: 'linear',
    in: 'ease-in',
    out: 'ease-out',
    inOut: 'ease-in-out',
    bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
  },
} as const;

// =============================================================================
// BREAKPOINTS - Responsive design
// =============================================================================

export const breakpoints = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

// =============================================================================
// Z-INDEX - Camadas de profundidade
// =============================================================================

export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  docked: 10,
  dropdown: 1000,
  sticky: 1020,
  banner: 1030,
  overlay: 1040,
  modal: 1050,
  popover: 1060,
  skipLink: 1070,
  toast: 1080,
  tooltip: 1090,
} as const;

// =============================================================================
// OPACIDADES - Glass effects
// =============================================================================

export const opacity = {
  0: '0',
  5: '0.05',
  10: '0.1',
  20: '0.2',
  25: '0.25',
  30: '0.3',
  40: '0.4',
  50: '0.5',
  60: '0.6',
  70: '0.7',
  75: '0.75',
  80: '0.8',
  90: '0.9',
  95: '0.95',
  100: '1',
} as const;

// =============================================================================
// UTILITÁRIOS DE APLICAÇÃO
// =============================================================================

// Tipo para chaves de opacity
export type OpacityKeys = '0' | '5' | '10' | '20' | '25' | '30' | '40' | '50' | '60' | '70' | '75' | '80' | '90' | '95' | '100';

/**
 * Aplica opacidade a uma cor
 */
export const withOpacity = (color: string, opacityKey: OpacityKeys): string => {
  if (color.startsWith('#')) {
    // Hex to rgba
    const r = parseInt(color.slice(1, 3), 16);
    const g = parseInt(color.slice(3, 5), 16);
    const b = parseInt(color.slice(5, 7), 16);
    const opacityValue = opacity[opacityKey];
    return `rgba(${r}, ${g}, ${b}, ${opacityValue})`;
  }
  return color;
};

/**
 * Gera classe CSS para glass effect
 */
export const glassEffect = (intensity: 'light' | 'medium' | 'strong' = 'medium') => {
  // Map intensity to correct shadow key
  const shadowKey = intensity === 'light' ? 'soft' : intensity === 'strong' ? 'strong' : 'medium';

  return {
    backgroundColor: colors.glass[intensity === 'light' ? 'light' : intensity === 'strong' ? 'dark' : 'medium'],
    backdropFilter: 'blur(12px)',
    border: `1px solid ${colors.glass.border}`,
    boxShadow: shadows.glass[shadowKey as keyof typeof shadows.glass],
  };
};

/**
 * Gera classes de foco acessíveis
 */
export const focusRing = (color: string = colors.primary[500]) => ({
  outline: 'none',
  ring: `2px solid ${color}`,
  ringOffset: '2px',
});

/**
 * Type definitions para TypeScript
 */
export type ColorKeys = keyof typeof colors;
export type SpacingKeys = keyof typeof spacing;
export type TypographyKeys = keyof typeof typography;
export type ShadowKeys = keyof typeof shadows;
export type BorderRadiusKeys = keyof typeof borderRadius;
export type BreakpointKeys = keyof typeof breakpoints;

