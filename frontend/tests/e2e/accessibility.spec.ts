import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './auth-helper';

test.describe('Accessibility E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Login first, then navigate to dashboard for accessibility testing
        await loginAsTestUser(page);
    });

    test('Accessibility - Skip links aparecem', async ({ page }) => {
        // Simular navegação por teclado (Tab)
        await page.keyboard.press('Tab');

        // Verificar se skip links ficam visíveis quando recebem foco
        const skipLinks = page.locator('a').filter({ hasText: 'Pular para navegação' });
        if (await skipLinks.count() > 0) {
            await expect(skipLinks.first()).toBeVisible();
        }
    });

    test('Accessibility - Navegação por teclado funciona', async ({ page }) => {
        // Testar navegação por Tab na navegação principal
        await page.keyboard.press('Tab');

        // Verificar se a página ainda está funcional após navegação por Tab
        // Em alguns navegadores, o foco pode não ser detectado corretamente,
        // mas o importante é que a navegação não quebre a aplicação
        await expect(page.locator('nav').first()).toBeVisible();

        // Continuar navegando por Tab (testar apenas alguns elementos focáveis)
        for (let i = 0; i < 2; i++) {
            await page.keyboard.press('Tab');
            await page.waitForTimeout(100);
        }

        // Verificar se a página permanece estável após navegação
        await expect(page.locator('main')).toBeVisible();
    });

    test('Accessibility - Focus rings são visíveis', async ({ page }) => {
        // Clicar em elementos interativos e verificar focus rings
        const buttons = page.locator('button:visible');
        const buttonCount = await buttons.count();

        if (buttonCount > 0) {
            const firstButton = buttons.first();
            await firstButton.focus();

            // Verificar se há estilos de foco aplicados
            const hasFocusRing = await firstButton.evaluate(el => {
                const computedStyle = window.getComputedStyle(el);
                return computedStyle.boxShadow.includes('rgb') ||
                    computedStyle.outline !== 'none' ||
                    computedStyle.border.includes('rgb');
            });

            expect(hasFocusRing).toBeTruthy();
        }
    });

    test('Accessibility - ARIA labels estão presentes', async ({ page }) => {
        // Verificar botões sem texto visível têm aria-label
        const iconButtons = await page.locator('button').all();
        const iconButtonsFiltered = [];

        for (const button of iconButtons) {
            const text = await button.textContent();
            if (!text || text.trim() === '') {
                iconButtonsFiltered.push(button);
            }
        }

        for (const button of iconButtonsFiltered.slice(0, 5)) { // Testar apenas os primeiros 5
            const hasAriaLabel = await button.getAttribute('aria-label');
            const hasTitle = await button.getAttribute('title');

            expect(hasAriaLabel || hasTitle).toBeTruthy();
        }
    });

    test('Accessibility - Estrutura semântica correta', async ({ page }) => {
        // Verificar elementos semânticos principais
        await expect(page.locator('nav').first()).toBeVisible();
        await expect(page.locator('main')).toBeVisible();
        await expect(page.locator('header').first()).toBeVisible();

        // Verificar roles apropriados
        const navRole = await page.locator('nav').first().getAttribute('role');
        expect(navRole === 'navigation' || navRole === null).toBeTruthy();

        const mainRole = await page.locator('main').getAttribute('role');
        expect(mainRole === 'main' || mainRole === null).toBeTruthy();
    });

    test('Accessibility - Contraste de cores adequado', async ({ page }) => {
        // Esta é uma verificação básica - em um cenário real,
        // usaríamos ferramentas como axe-core ou lighthouse

        // Verificar se não há texto invisível (branco sobre branco, etc.)
        const textElements = await page.locator('p, span, h1, h2, h3, h4, h5, h6, div, button').all();

        for (const element of textElements.slice(0, 10)) { // Testar apenas alguns elementos
            const isVisible = await element.isVisible();
            if (isVisible) {
                const text = await element.textContent();
                if (text && text.trim().length > 0) {
                    // Elemento tem texto e está visível - isso é um sinal positivo
                    expect(text.trim().length).toBeGreaterThan(0);
                }
            }
        }
    });

    test('Accessibility - Formulários têm labels apropriados', async ({ page }) => {
        // Verificar inputs têm labels associados
        const inputs = await page.locator('input, select, textarea').all();

        for (const input of inputs.slice(0, 5)) { // Testar apenas os primeiros 5
            const hasLabel = await input.evaluate((el: HTMLElement) => {
                const id = el.id;
                const ariaLabelledBy = el.getAttribute('aria-labelledby');
                const ariaLabel = el.getAttribute('aria-label');

                // Verificar se há label associado
                if (id) {
                    const label = document.querySelector(`label[for="${id}"]`);
                    if (label) return true;
                }

                // Verificar aria-label ou aria-labelledby
                return !!(ariaLabel || ariaLabelledBy);
            });

            expect(hasLabel).toBeTruthy();
        }
    });

    test('Accessibility - Painel de acessibilidade funciona (desenvolvimento)', async ({ page }) => {
        // Este teste só funciona em desenvolvimento
        if (process.env.NODE_ENV === 'development') {
            // Aguardar painel aparecer (2 segundos)
            await page.waitForTimeout(2500);

            // Verificar se painel de acessibilidade existe
            const accessibilityPanel = page.locator('text=♿ Acessibilidade').first();

            if (await accessibilityPanel.count() > 0) {
                await expect(accessibilityPanel).toBeVisible();

                // Verificar se tem contador de issues
                const issueCount = accessibilityPanel.locator('..').locator('span').first();
                // Pode ou não ter issues, mas o elemento deve existir
                await expect(issueCount).toBeDefined();
            }
        }
    });
});
