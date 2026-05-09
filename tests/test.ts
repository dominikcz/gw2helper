import { expect, test } from '@playwright/test';

const routes = [
	'/daily/',
	'/events/',
	'/items/',
	'/materials/',
	'/achievements/',
	'/account/',
	'/characters/',
	'/guilds/',
	'/trading-post/',
	'/legendary/',
];

test('home route renders without fatal UI errors', async ({ page }) => {
	const pageErrors: string[] = [];
	page.on('pageerror', (err) => pageErrors.push(err.message));

	const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
	expect(response).not.toBeNull();
	await expect(page.locator('header h1')).toBeVisible();
	expect(pageErrors).toEqual([]);
});

for (const route of routes) {
	test(`route renders without fatal UI errors via navigation: ${route}`, async ({ page }) => {
		const pageErrors: string[] = [];
		page.on('pageerror', (err) => pageErrors.push(err.message));

		await page.goto('/', { waitUntil: 'domcontentloaded' });
		const routeLink = page.locator(`nav a[href$="${route}"]`).first();
		await expect(routeLink).toBeVisible();
		await routeLink.click();

		await expect(page).toHaveURL(new RegExp(`${route.replace(/\//g, '\\/')}$`));
		await expect(page.locator('header h1')).toBeVisible();
		expect(pageErrors).toEqual([]);
	});
}

test('first run on clean browser context (no cache/local storage) is stable', async ({ browser }) => {
	const context = await browser.newContext();
	await context.addInitScript(() => {
		window.localStorage.clear();
		window.sessionStorage.clear();

		if ('caches' in window) {
			void caches.keys().then((keys) => Promise.all(keys.map((key) => caches.delete(key))));
		}

		if ('indexedDB' in window && typeof indexedDB.databases === 'function') {
			void indexedDB.databases().then((databases) => {
				for (const db of databases) {
					if (db.name) {
						indexedDB.deleteDatabase(db.name);
					}
				}
			});
		}
	});

	const page = await context.newPage();
	const pageErrors: string[] = [];
	page.on('pageerror', (err) => pageErrors.push(err.message));

	const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
	expect(response).not.toBeNull();
	await expect(page.locator('header h1')).toBeVisible();
	await expect(page.locator('details.secondary')).toBeVisible();
	expect(pageErrors).toEqual([]);

	await context.close();
});
