'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook para funcionalidades de acessibilidade WCAG AA
 */
export function useAccessibility() {
  const focusableElementsString = 'a[href], area[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), button:not([disabled]), iframe, object, embed, [tabindex="0"], [contenteditable]';

  /**
   * Hook para trap focus dentro de um modal/container
   */
  const useFocusTrap = (isActive: boolean = true) => {
    const containerRef = useRef<HTMLElement>(null);

    useEffect(() => {
      if (!isActive || !containerRef.current) return;

      const container = containerRef.current;
      const focusableElements = container.querySelectorAll(focusableElementsString);
      const firstElement = focusableElements[0] as HTMLElement;
      const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Tab') {
          if (e.shiftKey) {
            // Shift + Tab
            if (document.activeElement === firstElement) {
              lastElement.focus();
              e.preventDefault();
            }
          } else {
            // Tab
            if (document.activeElement === lastElement) {
              firstElement.focus();
              e.preventDefault();
            }
          }
        }

        if (e.key === 'Escape') {
          // Optional: handle escape if needed
          // onEscape?.();
        }
      };

      document.addEventListener('keydown', handleKeyDown);

      // Focus no primeiro elemento quando ativado
      if (firstElement) {
        firstElement.focus();
      }

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
      };
    }, [isActive]);

    return containerRef;
  };

  /**
   * Hook para announcements de screen reader (live regions)
   */
  const useScreenReaderAnnouncement = () => {
    const announce = useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', priority);
      announcement.setAttribute('aria-atomic', 'true');
      announcement.setAttribute('class', 'sr-only');
      announcement.textContent = message;

      document.body.appendChild(announcement);

      // Remove after announcement
      setTimeout(() => {
        document.body.removeChild(announcement);
      }, 1000);
    }, []);

    return { announce };
  };

  /**
   * Hook para skip links (navegação rápida)
   */
  const useSkipLinks = () => {
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Tab' && !e.shiftKey) {
          // Show skip links on first Tab
          const skipLinks = document.querySelectorAll('[data-skip-link]');
          skipLinks.forEach(link => {
            (link as HTMLElement).style.display = 'block';
          });
        }
      };

      const handleFocusOut = () => {
        // Hide skip links when focus moves away
        const skipLinks = document.querySelectorAll('[data-skip-link]');
        skipLinks.forEach(link => {
          (link as HTMLElement).style.display = 'none';
        });
      };

      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('focusout', handleFocusOut);

      return () => {
        document.removeEventListener('keydown', handleKeyDown);
        document.removeEventListener('focusout', handleFocusOut);
      };
    }, []);
  };

  /**
   * Hook para validação de contraste de cores
   */
  const validateContrast = useCallback((foreground: string, background: string): boolean => {
    // Simple contrast validation (WCAG AA requires 4.5:1 ratio)
    // This is a simplified version - use a proper library for production
    const getLuminance = (color: string): number => {
      // Convert hex to RGB, then to luminance
      // Simplified implementation
      return 0.5; // Placeholder - implement proper luminance calculation
    };

    const lum1 = getLuminance(foreground);
    const lum2 = getLuminance(background);
    const ratio = (Math.max(lum1, lum2) + 0.05) / (Math.min(lum1, lum2) + 0.05);

    return ratio >= 4.5;
  }, []);

  /**
   * Hook para gerenciamento de headings (hierarquia)
   */
  const useHeadingLevel = (level: 1 | 2 | 3 | 4 | 5 | 6 = 1) => {
    const HeadingComponent = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

    return {
      Component: HeadingComponent,
      props: {
        role: 'heading',
        'aria-level': level,
      }
    };
  };

  /**
   * Utilitários de acessibilidade
   */
  const accessibilityUtils = {
    /**
     * Gera descrição acessível para botões de ação
     */
    getActionButtonLabel: (action: string, item: string, itemName?: string): string => {
      return `${action} ${item}${itemName ? ` ${itemName}` : ''}`;
    },

    /**
     * Gera label para status badges
     */
    getStatusLabel: (status: string, itemType: string): string => {
      return `${itemType} com status ${status}`;
    },

    /**
     * Gera descrição para formulários
     */
    getFormDescription: (formName: string, fieldCount: number): string => {
      return `Formulário ${formName} com ${fieldCount} campos obrigatórios`;
    },

    /**
     * Gera label para contadores
     */
    getCountLabel: (count: number, itemType: string, total?: number): string => {
      if (total !== undefined) {
        return `${count} de ${total} ${itemType}${count !== 1 ? 's' : ''}`;
      }
      return `${count} ${itemType}${count !== 1 ? 's' : ''}`;
    }
  };

  return {
    useFocusTrap,
    useScreenReaderAnnouncement,
    useSkipLinks,
    validateContrast,
    useHeadingLevel,
    accessibilityUtils,
    focusableElementsString,
  };
}
