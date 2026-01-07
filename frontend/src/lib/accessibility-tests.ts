/**
 * Testes básicos de acessibilidade WCAG AA
 * Funções utilitárias para validação de conformidade
 */

import { colors } from './design-tokens';

/**
 * Valida contraste de cores (WCAG AA)
 * @param foreground Cor do texto
 * @param background Cor do fundo
 * @returns true se passar no teste de contraste
 */
export function validateContrast(foreground: string, background: string): boolean {
  // Função simplificada de cálculo de luminância
  const getLuminance = (hex: string): number => {
    const rgb = hex.replace('#', '').match(/.{2}/g);
    if (!rgb) return 0;

    const r = parseInt(rgb[0], 16) / 255;
    const g = parseInt(rgb[1], 16) / 255;
    const b = parseInt(rgb[2], 16) / 255;

    const toLinear = (c: number) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

    return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
  };

  const lum1 = getLuminance(foreground);
  const lum2 = getLuminance(background);
  const ratio = (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);

  return ratio >= 4.5; // WCAG AA para texto normal
}

/**
 * Valida se um elemento tem boa acessibilidade
 */
export function validateElementAccessibility(element: HTMLElement): {
  hasAriaLabel: boolean;
  hasAltText: boolean;
  hasFocusRing: boolean;
  hasProperContrast: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  let hasAriaLabel = false;
  let hasAltText = false;
  let hasFocusRing = false;
  let hasProperContrast = false;

  // Verifica aria-label ou aria-labelledby
  if (element.hasAttribute('aria-label') || element.hasAttribute('aria-labelledby')) {
    hasAriaLabel = true;
  } else if (element.tagName === 'IMG' && !element.hasAttribute('alt')) {
    issues.push('Imagem sem atributo alt');
  } else if (element.tagName === 'BUTTON' && !element.textContent?.trim() && !element.hasAttribute('aria-label')) {
    issues.push('Botão sem texto ou aria-label');
  }

  // Verifica imagens
  if (element.tagName === 'IMG') {
    hasAltText = element.hasAttribute('alt') && (element as HTMLImageElement).alt.trim() !== '';
    if (!hasAltText) {
      issues.push('Imagem sem texto alternativo');
    }
  }

  // Verifica foco visual
  const computedStyle = window.getComputedStyle(element);
  if (computedStyle.outline !== 'none' || computedStyle.boxShadow.includes('ring')) {
    hasFocusRing = true;
  } else {
    issues.push('Elemento sem indicador visual de foco');
  }

  // Verifica contraste (simplificado)
  const textColor = computedStyle.color;
  const bgColor = computedStyle.backgroundColor;

  // Extração básica de cores - em produção usar biblioteca especializada
  if (textColor && bgColor && textColor !== 'rgba(0, 0, 0, 0)' && bgColor !== 'rgba(0, 0, 0, 0)') {
    hasProperContrast = true; // Placeholder - implementar cálculo real
  }

  return {
    hasAriaLabel,
    hasAltText,
    hasFocusRing,
    hasProperContrast,
    issues,
  };
}

/**
 * Executa verificações básicas de acessibilidade na página
 */
export function runAccessibilityAudit(): {
  score: number;
  totalChecks: number;
  passedChecks: number;
  issues: Array<{ element: string; issues: string[] }>;
} {
  if (typeof window === 'undefined') {
    return { score: 0, totalChecks: 0, passedChecks: 0, issues: [] };
  }

  const issues: Array<{ element: string; issues: string[] }> = [];
  let totalChecks = 0;
  let passedChecks = 0;

  // Verifica botões
  const buttons = document.querySelectorAll('button');
  buttons.forEach((button, index) => {
    totalChecks++;
    const validation = validateElementAccessibility(button as HTMLElement);
    if (validation.issues.length === 0) {
      passedChecks++;
    } else {
      issues.push({
        element: `Button ${index + 1}`,
        issues: validation.issues,
      });
    }
  });

  // Verifica imagens
  const images = document.querySelectorAll('img');
  images.forEach((img, index) => {
    totalChecks++;
    const validation = validateElementAccessibility(img as HTMLElement);
    if (validation.issues.length === 0) {
      passedChecks++;
    } else {
      issues.push({
        element: `Image ${index + 1}`,
        issues: validation.issues,
      });
    }
  });

  // Verifica links
  const links = document.querySelectorAll('a');
  links.forEach((link, index) => {
    totalChecks++;
    const href = link.getAttribute('href');
    if (!href || href === '#') {
      issues.push({
        element: `Link ${index + 1}`,
        issues: ['Link sem href válido'],
      });
    } else {
      passedChecks++;
    }
  });

  // Verifica headings
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
  let hasH1 = false;
  headings.forEach((heading) => {
    if (heading.tagName === 'H1') hasH1 = true;
  });

  if (!hasH1) {
    issues.push({
      element: 'Document',
      issues: ['Página sem heading H1'],
    });
  }

  const score = totalChecks > 0 ? Math.round((passedChecks / totalChecks) * 100) : 0;

  return {
    score,
    totalChecks,
    passedChecks,
    issues,
  };
}

/**
 * Verifica se o design system está sendo usado corretamente
 */
export function validateDesignSystemUsage(): {
  isUsingDesignTokens: boolean;
  hasConsistentSpacing: boolean;
  hasProperColors: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Verifica se cores do design system estão sendo usadas
  const allElements = document.querySelectorAll('*');
  let hasDesignSystemColors = false;
  let hasConsistentSpacing = false;

  allElements.forEach((element) => {
    const computedStyle = window.getComputedStyle(element);

    // Verifica cores do design system
    Object.values(colors).forEach((colorGroup) => {
      if (typeof colorGroup === 'object') {
        Object.values(colorGroup).forEach((color) => {
          if (computedStyle.color === color || computedStyle.backgroundColor === color) {
            hasDesignSystemColors = true;
          }
        });
      }
    });

    // Verifica espaçamentos consistentes (simplificado)
    const padding = computedStyle.padding;
    const margin = computedStyle.margin;
    if (padding.includes('rem') || margin.includes('rem')) {
      hasConsistentSpacing = true;
    }
  });

  if (!hasDesignSystemColors) {
    issues.push('Cores do design system não estão sendo usadas adequadamente');
  }

  return {
    isUsingDesignTokens: hasDesignSystemColors,
    hasConsistentSpacing,
    hasProperColors: hasDesignSystemColors,
    issues,
  };
}

/**
 * Gera relatório completo de acessibilidade
 */
export function generateAccessibilityReport(): {
  accessibility: ReturnType<typeof runAccessibilityAudit>;
  designSystem: ReturnType<typeof validateDesignSystemUsage>;
  overallScore: number;
} {
  const accessibility = runAccessibilityAudit();
  const designSystem = validateDesignSystemUsage();

  const overallScore = Math.round(
    (accessibility.score + (designSystem.isUsingDesignTokens ? 100 : 0)) / 2
  );

  return {
    accessibility,
    designSystem,
    overallScore,
  };
}

