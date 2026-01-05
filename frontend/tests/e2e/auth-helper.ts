import { Page } from '@playwright/test';

export async function loginAsTestUser(page: Page, email = 'admin@test.com', password = 'admin123') {
    // Go to login page first
    await page.goto('/login');

    // Wait for the login form to load
    await page.waitForSelector('input[id="email"]');

    // Fill in login credentials
    await page.fill('input[id="email"]', email);
    await page.fill('input[id="password"]', password);

    // Submit the form
    await page.click('button[type="submit"]');

    // Wait for navigation to dashboard or check if login was successful
    try {
        await page.waitForURL('**/dashboard**', { timeout: 10000 });
    } catch (error) {
        // If navigation doesn't happen, check if we're still on login page with error
        const currentURL = page.url();
        if (currentURL.includes('/login')) {
            throw new Error('Login failed - still on login page');
        }
    }

    // Verify we're logged in by checking for dashboard elements
    await page.waitForSelector('nav', { timeout: 5000 });
}

export async function logout(page: Page) {
    // Clear localStorage and cookies
    await page.evaluate(() => {
        localStorage.clear();
    });

    await page.context().clearCookies();

    // Navigate to login page
    await page.goto('/login');
}

export async function mockAuthToken(page: Page, token = 'mock-jwt-token') {
    // Navigate to dashboard first to ensure page is loaded
    await page.goto('/dashboard');

    // Set token in localStorage after page loads
    await page.evaluate((token) => {
        localStorage.setItem('token', token);
    }, token);

    await page.context().addCookies([{
        name: 'token',
        value: token,
        domain: 'localhost',
        path: '/',
        httpOnly: false,
        secure: false,
    }]);

    // Reload the page to apply the token
    await page.reload();
    await page.waitForSelector('nav', { timeout: 5000 });
}
