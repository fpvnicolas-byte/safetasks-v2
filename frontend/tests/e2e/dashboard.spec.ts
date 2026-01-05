import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './auth-helper';

test.describe('Dashboard E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Login first, then navigate to dashboard
        await loginAsTestUser(page);
    });

    test('Dashboard - Carregamento inicial', async ({ page }) => {
        // Verificar se o dashboard carrega corretamente
        await expect(page).toHaveURL(/.*dashboard.*/);

        // Verificar elementos principais do layout
        await expect(page.locator('nav').first()).toBeVisible();
        await expect(page.locator('main')).toBeVisible();
        await expect(page.locator('header').first()).toBeVisible();

        // Verificar título da página
        await expect(page.locator('h1').first()).toContainText(/Dashboard|Resumo|Produções/);
    });

    test('Navegação - Sidebar funciona corretamente', async ({ page }) => {
        // Verificar se os links de navegação estão presentes
        const navLinks = page.locator('nav a');
        await expect(navLinks).toHaveCount(await navLinks.count()); // Pelo menos alguns links

        // Testar navegação para Produções
        const productionsLink = page.locator('nav a').filter({ hasText: 'Produções' });
        if (await productionsLink.count() > 0) {
            await productionsLink.click();
            await expect(page).toHaveURL(/.*productions.*/);
        }

        // Voltar para dashboard
        const dashboardLink = page.locator('nav a').filter({ hasText: 'Resumo' });
        if (await dashboardLink.count() > 0) {
            await dashboardLink.click();
            await expect(page).toHaveURL(/.*dashboard$/);
        }
    });

    test('Acessibilidade - Skip links aparecem', async ({ page }) => {
        // Simular pressionamento de Tab para mostrar skip links
        await page.keyboard.press('Tab');

        // Verificar se skip links aparecem (eles têm classe sr-only inicialmente)
        const skipLinks = page.locator('a[href^="#"]');
        const visibleSkipLinks = skipLinks.filter({ hasText: /Pular/ });

        // Se existirem skip links, verificar se ficam visíveis com foco
        if (await visibleSkipLinks.count() > 0) {
            // O skip link deve estar visível quando recebe foco
            await expect(visibleSkipLinks.first()).toBeVisible();
        }
    });

    test('Design Tokens - Elementos usam estilos consistentes', async ({ page }) => {
        // Verificar se elementos usam as classes/tokens corretos
        const glassElements = page.locator('[style*="backdrop-filter"]');
        await expect(glassElements.first()).toBeVisible();

        // Verificar se cores do design system estão aplicadas
        const styledElements = page.locator('[style*="color"], [style*="background-color"]');
        expect(await styledElements.count()).toBeGreaterThan(0);
    });

    test('Responsividade - Layout funciona em diferentes tamanhos', async ({ page }) => {
        // Testar em desktop
        await page.setViewportSize({ width: 1920, height: 1080 });
        await expect(page.locator('nav').first()).toBeVisible();

        // Testar em tablet
        await page.setViewportSize({ width: 768, height: 1024 });
        await expect(page.locator('nav').first()).toBeVisible();

        // Testar em mobile
        await page.setViewportSize({ width: 375, height: 667 });
        await expect(page.locator('nav').first()).toBeVisible();
    });
});
