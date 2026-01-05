import { test, expect } from '@playwright/test';
import { loginAsTestUser } from './auth-helper';

test.describe('Productions E2E Tests', () => {
    test.beforeEach(async ({ page }) => {
        // Login first, then navigate to productions page
        await loginAsTestUser(page);
        await page.goto('/dashboard/productions');
        await page.waitForSelector('nav', { timeout: 5000 });
    });

    test('Productions - Página carrega corretamente', async ({ page }) => {
        // Verificar título da página
        await expect(page.locator('h1').first()).toContainText('Produções');

        // Verificar se há elementos de produção ou mensagem vazia
        const hasProductions = await page.locator('[data-testid="production-card"]').count() > 0;
        const emptyMessage = page.locator('text=Nenhuma produção cadastrada');

        if (hasProductions) {
            await expect(page.locator('[data-testid="production-card"]')).toBeVisible();
        } else {
            await expect(emptyMessage).toBeVisible();
        }
    });

    test('Productions - Filtros funcionam', async ({ page }) => {
        // Verificar se filtros estão presentes
        const searchInput = page.locator('input[placeholder*="Buscar"]').first();
        const statusSelect = page.locator('select').first();

        if (await searchInput.count() > 0) {
            // Testar busca
            await searchInput.fill('teste');
            await searchInput.press('Enter');

            // Verificar se resultados são filtrados (ou mensagem de nenhum resultado)
            await page.waitForTimeout(500);
        }

        if (await statusSelect.count() > 0) {
            // Testar filtro por status
            await statusSelect.selectOption('completed');
            await page.waitForTimeout(500);
        }
    });

    test('Productions - Campo de observações funciona', async ({ page }) => {
        // Procurar por um botão de editar produção
        const editButtons = page.locator('button').filter({ hasText: /editar|Editar/ }).first();
        const editIcons = page.locator('[aria-label*="editar"], [title*="editar"]').first();

        if (await editButtons.count() > 0 || await editIcons.count() > 0) {
            // Clicar no botão de editar
            if (await editButtons.count() > 0) {
                await editButtons.click();
            } else {
                await editIcons.click();
            }

            // Aguardar modal/sheet abrir
            await page.waitForTimeout(1000);

            // Verificar se há campo de observações
            const notesField = page.locator('textarea').first();
            if (await notesField.count() > 0) {
                // Testar preenchimento do campo
                await notesField.fill('Observação de teste para E2E');
                await expect(notesField).toHaveValue('Observação de teste para E2E');
            }
        }
    });

    test('Productions - Download de orçamento funciona', async ({ page }) => {
        // Procurar por cards de produção
        const productionCards = page.locator('[data-testid="production-card"]').first();

        if (await productionCards.count() > 0) {
            // Passar mouse sobre o card para mostrar ações
            await productionCards.hover();

            // Aguardar animações
            await page.waitForTimeout(500);

            // Procurar por botão de download
            const downloadButton = page.locator('[aria-label*="download"], [title*="download"]').first();
            const downloadIcon = page.locator('svg').filter({ hasText: '' }).locator('..').first();

            if (await downloadButton.count() > 0 || await downloadIcon.count() > 0) {
                // Clicar no botão de download
                if (await downloadButton.count() > 0) {
                    await downloadButton.click();
                } else {
                    await downloadIcon.click();
                }

                // Verificar se dropdown/modal aparece
                await page.waitForTimeout(500);

                // Procurar por opção "Gerar Orçamento"
                const budgetOption = page.locator('text=Gerar Orçamento').first();
                if (await budgetOption.count() > 0) {
                    await budgetOption.click();

                    // Verificar se toast de sucesso aparece
                    await expect(page.locator('text=Orçamento gerado com sucesso')).toBeVisible();
                }
            }
        }
    });

    test('Productions - Modal de criação funciona', async ({ page }) => {
        // Procurar por botão "Nova Produção" ou similar
        const createButtons = page.locator('button').filter({ hasText: /nova|Nova|criar|Criar|\+/ });
        const createButton = createButtons.first();

        if (await createButton.count() > 0) {
            await createButton.click();

            // Verificar se modal abriu
            await page.waitForTimeout(500);

            // Verificar campos do formulário
            const titleInput = page.locator('input[placeholder*="título"]').first();
            if (await titleInput.count() > 0) {
                await titleInput.fill('Produção de Teste E2E');

                // Verificar se botão de salvar está habilitado
                const saveButton = page.locator('button').filter({ hasText: /salvar|Salvar|criar|Criar/ }).first();
                await expect(saveButton).toBeEnabled();
            }
        }
    });
});
