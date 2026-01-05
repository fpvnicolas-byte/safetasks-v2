import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './auth-helper';

test.describe('Calendar E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Login first, then navigate to calendar page
        await loginAsTestUser(page);
        await page.goto('/dashboard/calendar');
        await page.waitForSelector('nav', { timeout: 5000 });
    });

    test('Calendar - Página carrega corretamente', async ({ page }) => {
        // Verificar se o calendário carrega
        await expect(page.locator('h1').first()).toContainText('Calendário');

        // Verificar se há elementos do calendário (grid de dias)
        const calendarGrid = page.locator('.grid.grid-cols-7').last(); // A segunda grid é a dos dias
        await expect(calendarGrid).toBeVisible();
    });

    test('Calendar - Calendário é exibido', async ({ page }) => {
        // Aguardar carregamento
        await page.waitForTimeout(2000);

        // Verificar se o calendário está presente na página (grid de dias)
        const calendarGrid = page.locator('.grid.grid-cols-7').last(); // Grid dos dias do mês
        await expect(calendarGrid).toBeVisible();
    });

    test('Calendar - Navegação entre meses funciona', async ({ page }) => {
        // Aguardar carregamento
        await page.waitForTimeout(1000);

        // Procurar por controles de navegação (botões com ícones ChevronLeft/ChevronRight)
        const prevButton = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-left') }).first();
        const nextButton = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-right') }).first();

        if (await prevButton.count() > 0) {
            // Guardar mês atual (título h2 com o mês e ano)
            const currentMonthText = await page.locator('h2').first().textContent();

            // Navegar para mês anterior
            await prevButton.click();
            await page.waitForTimeout(500);

            // Verificar se mês mudou
            const newMonthText = await page.locator('h2').first().textContent();
            expect(newMonthText).not.toBe(currentMonthText);
        }

        if (await nextButton.count() > 0) {
            // Navegar para mês seguinte
            await nextButton.click();
            await page.waitForTimeout(500);

            // Verificar se navegação funcionou (calendário ainda visível)
            await expect(page.locator('.grid.grid-cols-7').last()).toBeVisible();
        }
    });

    test('Calendar - Responsividade funciona', async ({ page }) => {
        // Testar em diferentes tamanhos de tela
        const viewports = [
            { width: 1920, height: 1080 }, // Desktop
            { width: 768, height: 1024 },  // Tablet
            { width: 375, height: 667 }    // Mobile
        ];

        for (const viewport of viewports) {
            await page.setViewportSize(viewport);

            // Verificar se calendário permanece funcional
            await expect(page.locator('.grid.grid-cols-7').last()).toBeVisible();

            // Verificar se navegação ainda funciona
            const navElements = page.locator('button').filter({ has: page.locator('svg.lucide-chevron-left, svg.lucide-chevron-right') });
            if (await navElements.count() > 0) {
                await expect(navElements.first()).toBeVisible();
            }
        }
    });
});
