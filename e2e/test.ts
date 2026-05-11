import { expect, test } from '@playwright/test';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// The app is served under /gw2helper base path.
// Playwright's baseURL is 'http://localhost:4173/gw2helper', but goto('/foo/')
// resolves to the origin + '/foo/' (absolute), not baseURL + '/foo/'.
// Use this constant to build full paths for direct navigation.
const BASE = '/gw2helper';

async function expectNoPageErrors(page: import('@playwright/test').Page): Promise<string[]> {
	const errors: string[] = [];
	page.on('pageerror', (err) => errors.push(err.message));
	return errors;
}

// ---------------------------------------------------------------------------
// Route definitions: path → expected title fragment and page h1 (if public)
// ---------------------------------------------------------------------------

const routePages: Array<{ route: string; titlePart: string; heading?: string }> = [
	{ route: '/daily/',        titlePart: 'daily' },
	{ route: '/events/',       titlePart: 'events',       heading: 'Events' },
	{ route: '/items/',        titlePart: 'items' },
	{ route: '/materials/',    titlePart: 'materials' },
	{ route: '/achievements/', titlePart: 'achievements' },
	{ route: '/account/',      titlePart: 'account' },
	{ route: '/characters/',   titlePart: 'characters' },
	{ route: '/guilds/',       titlePart: 'guilds' },
	{ route: '/trading-post/', titlePart: 'trading-post' },
	{ route: '/legendary/',    titlePart: 'legendary' },
];

// ---------------------------------------------------------------------------
// 1. Home page
// ---------------------------------------------------------------------------

test('home route renders without fatal UI errors', async ({ page }) => {
	const pageErrors = await expectNoPageErrors(page);

	const response = await page.goto('/', { waitUntil: 'domcontentloaded' });
	expect(response).not.toBeNull();
	await expect(page.locator('header h1')).toBeVisible();
	expect(pageErrors).toEqual([]);
});

test('home page layout shows app name in header', async ({ page }) => {
	await page.goto('/', { waitUntil: 'domcontentloaded' });
	await expect(page.locator('header h1')).toContainText('GW2 Helper');
});

// ---------------------------------------------------------------------------
// 2. Navigation via nav links
// ---------------------------------------------------------------------------

for (const { route } of routePages) {
	test(`nav link navigates to ${route} without errors`, async ({ page }) => {
		const pageErrors = await expectNoPageErrors(page);

		await page.goto('/', { waitUntil: 'domcontentloaded' });
		const routeLink = page.locator(`nav a[href$="${route}"]`).first();
		await expect(routeLink).toBeVisible();
		await routeLink.click();

		await expect(page).toHaveURL(new RegExp(`${route.replace(/\//g, '\\/')}$`));
		await expect(page.locator('header h1')).toBeVisible();
		expect(pageErrors).toEqual([]);
	});
}

// ---------------------------------------------------------------------------
// 3. Direct URL navigation: page title and public-route h1
// ---------------------------------------------------------------------------

for (const { route, titlePart, heading } of routePages) {
	test(`direct URL ${route} sets page title containing "${titlePart}"`, async ({ page }) => {
		await page.goto(BASE + route, { waitUntil: 'domcontentloaded' });
		await expect(page).toHaveTitle(new RegExp(titlePart, 'i'));
	});

	if (heading) {
		test(`direct URL ${route} shows correct h1: "${heading}"`, async ({ page }) => {
			await page.goto(BASE + route, { waitUntil: 'domcontentloaded' });
			await expect(page.locator('main h1')).toContainText(heading);
		});
	}
}

// ---------------------------------------------------------------------------
// 4. Active nav link highlights the current page
// ---------------------------------------------------------------------------

for (const { route } of routePages) {
	test(`nav link for ${route} is marked active when on that page`, async ({ page }) => {
		await page.goto(BASE + route, { waitUntil: 'domcontentloaded' });
		const link = page.locator(`nav a[href$="${route}"]`).first();
		await expect(link).toBeVisible();
		await expect(link).toHaveClass(/active/);
	});
}

// ---------------------------------------------------------------------------
// 5. Layout: API key input field is present
// ---------------------------------------------------------------------------

test('API key input field is present in the layout', async ({ page }) => {
	await page.goto('/', { waitUntil: 'domcontentloaded' });
	await expect(page.locator('#api-key')).toBeVisible();
});

test('API key label reads "Your API key:"', async ({ page }) => {
	await page.goto('/', { waitUntil: 'domcontentloaded' });
	await expect(page.locator('label[for="api-key"]')).toContainText('Your API key');
});

// ---------------------------------------------------------------------------
// 6. Layout: locale switch is present
// ---------------------------------------------------------------------------

test('locale switch is rendered in the layout', async ({ page }) => {
	await page.goto('/', { waitUntil: 'domcontentloaded' });
	await expect(page.locator('#locale-switch')).toBeVisible();
});

// ---------------------------------------------------------------------------
// 7. Clean browser context (no cache / local storage)
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// 8. Back-to-top button appears after scrolling
// ---------------------------------------------------------------------------

test('back-to-top button appears after scrolling down on events page', async ({ page }) => {
	// /events/ does not require API key, so content is rendered
	await page.goto(BASE + '/events/', { waitUntil: 'domcontentloaded' });
	// Directly trigger the Svelte scrollY binding by dispatching scroll event
	await page.evaluate(() => {
		// Override scrollY to exceed the 1000px threshold without needing real scroll height
		Object.defineProperty(window, 'scrollY', { value: 1200, configurable: true });
		window.dispatchEvent(new Event('scroll'));
	});
	await page.waitForTimeout(300);
	await expect(page.locator('button.back-to-top')).toBeVisible();
});

// ---------------------------------------------------------------------------
// 9. All nav links are present on home page
// ---------------------------------------------------------------------------

test('all expected nav links are present', async ({ page }) => {
	await page.goto('/', { waitUntil: 'domcontentloaded' });
	for (const { route } of routePages) {
		await expect(page.locator(`nav a[href$="${route}"]`).first()).toBeVisible();
	}
});

// ---------------------------------------------------------------------------
// 10. Tab-based navigation on events page (no API key required)
// ---------------------------------------------------------------------------

test('events page: first tab (Event timers) is selected by default', async ({ page }) => {
	await page.goto(BASE + '/events/', { waitUntil: 'domcontentloaded' });
	const firstTab = page.locator('button.tab').first();
	await expect(firstTab).toBeVisible();
	await expect(firstTab).toHaveClass(/selected/);
});

test('events page: clicking Reminders tab switches active tab', async ({ page }) => {
	await page.goto(BASE + '/events/', { waitUntil: 'domcontentloaded' });
	const tabs = page.locator('button.tab');
	const remindersTab = tabs.nth(1);
	await remindersTab.click();
	await expect(remindersTab).toHaveClass(/selected/);
	// first tab should no longer be selected
	await expect(tabs.first()).not.toHaveClass(/selected/);
});

test('events page: both tab buttons are rendered', async ({ page }) => {
	await page.goto(BASE + '/events/', { waitUntil: 'domcontentloaded' });
	await expect(page.locator('button.tab')).toHaveCount(2);
});

// ---------------------------------------------------------------------------
// 11. /achievements/[id] route
// ---------------------------------------------------------------------------

test('achievements/[id] with invalid id shows not-found fallback without errors', async ({ page }) => {
	const pageErrors = await expectNoPageErrors(page);
	await page.goto(BASE + '/achievements/999999999/', { waitUntil: 'domcontentloaded' });
	// Without API key the page renders the not-found state
	await expect(page.locator('h1').first()).toBeVisible();
	expect(pageErrors).toEqual([]);
});

test('achievements/[id] sets page title containing "achievements"', async ({ page }) => {
	await page.goto(BASE + '/achievements/123/', { waitUntil: 'domcontentloaded' });
	await expect(page).toHaveTitle(/achievements/i);
});

test('achievements/[id] has a back-to-list link', async ({ page }) => {
	await page.goto(BASE + '/achievements/123/', { waitUntil: 'domcontentloaded' });
	// Without API key: page renders "not found" state which includes back link
	const backLink = page.locator(`a[href$="/achievements/"]`).first();
	await expect(backLink).toBeVisible();
});

test('achievements/[id] with non-numeric id is stable', async ({ page }) => {
	const pageErrors = await expectNoPageErrors(page);
	await page.goto(BASE + '/achievements/abc/', { waitUntil: 'domcontentloaded' });
	await expect(page.locator('h1').first()).toBeVisible();
	expect(pageErrors).toEqual([]);
});

// ---------------------------------------------------------------------------
// 12. Authenticated routes — Play for Free account
// API key for a free-to-play account: minimal content, no expansions owned
// ---------------------------------------------------------------------------

const PF2_KEY = 'C1274800-B077-0B4A-831E-2FCBD13F66A3EB4E254C-90E1-4E68-B077-359DECF034B3';

test('PF2: account page loads and shows account name heading', async ({ page }) => {
	const pageErrors = await expectNoPageErrors(page);
	await page.goto(BASE + `/account/?key=${PF2_KEY}`, { waitUntil: 'domcontentloaded' });
	// h3 appears only after the GW2 API account call resolves
	await expect(page.locator('h3').first()).toBeVisible({ timeout: 25000 });
	expect(pageErrors).toEqual([]);
});

test('PF2: account page renders "accessible content" widgets group', async ({ page }) => {
	await page.goto(BASE + `/account/?key=${PF2_KEY}`, { waitUntil: 'domcontentloaded' });
	await expect(page.locator('h3').first()).toBeVisible({ timeout: 25000 });
	// WidgetsGroup with expansion images must be rendered
	await expect(page.locator('.widgets-group').first()).toBeVisible();
});

test('PF2: account page shows Play for Free logo as active', async ({ page }) => {
	await page.goto(BASE + `/account/?key=${PF2_KEY}`, { waitUntil: 'domcontentloaded' });
	await expect(page.locator('h3').first()).toBeVisible({ timeout: 25000 });
	// PlayForFree has showOnlyWhenOwned=true, so it's only rendered when owned — and it should be active
	const pf2Img = page.locator('img[src*="GW2Logo_new.png"]').first();
	await expect(pf2Img).toBeVisible();
	await expect(pf2Img).toHaveClass(/active/);
});

test('PF2: account page shows Heart of Thorns expansion as NOT active', async ({ page }) => {
	await page.goto(BASE + `/account/?key=${PF2_KEY}`, { waitUntil: 'domcontentloaded' });
	await expect(page.locator('h3').first()).toBeVisible({ timeout: 25000 });
	// HoT is always shown but without active class for F2P account
	const hotImg = page.locator('img[src*="HoT_Texture"]').first();
	await expect(hotImg).toBeVisible();
	await expect(hotImg).not.toHaveClass(/active/);
});

test('PF2: account page shows Path of Fire expansion as NOT active', async ({ page }) => {
	await page.goto(BASE + `/account/?key=${PF2_KEY}`, { waitUntil: 'domcontentloaded' });
	await expect(page.locator('h3').first()).toBeVisible({ timeout: 25000 });
	const pofImg = page.locator('img[src*="GW2-PoF"]').first();
	await expect(pofImg).toBeVisible();
	await expect(pofImg).not.toHaveClass(/active/);
});

test('PF2: characters page loads without errors', async ({ page }) => {
	const pageErrors = await expectNoPageErrors(page);
	await page.goto(BASE + `/characters/?key=${PF2_KEY}`, { waitUntil: 'domcontentloaded' });
	await expect(page.locator('h1').first()).toBeVisible({ timeout: 25000 });
	expect(pageErrors).toEqual([]);
});

test('PF2: achievements page loads and resolves data', async ({ page }) => {
	const pageErrors = await expectNoPageErrors(page);
	await page.goto(BASE + `/achievements/?key=${PF2_KEY}`, { waitUntil: 'domcontentloaded' });
	// WidgetsGroup appears after the achievements promise resolves
	await expect(page.locator('.widgets-group').first()).toBeVisible({ timeout: 25000 });
	expect(pageErrors).toEqual([]);
});

// ---------------------------------------------------------------------------
// 13. Authenticated routes — Full account (all expansions, many achievements)
// ---------------------------------------------------------------------------

const FULL_KEY = '1416FA0A-4F5D-8D42-8C08-7EFC5E1E3A3CF64FE82F-FE60-49DF-8DFB-EBAFE5BAEA3F';

test('Full: account page loads and shows account name heading', async ({ page }) => {
	const pageErrors = await expectNoPageErrors(page);
	await page.goto(BASE + `/account/?key=${FULL_KEY}`, { waitUntil: 'domcontentloaded' });
	await expect(page.locator('h3').first()).toBeVisible({ timeout: 25000 });
	expect(pageErrors).toEqual([]);
});

test('Full: account page shows Heart of Thorns as active', async ({ page }) => {
	await page.goto(BASE + `/account/?key=${FULL_KEY}`, { waitUntil: 'domcontentloaded' });
	await expect(page.locator('h3').first()).toBeVisible({ timeout: 25000 });
	const hotImg = page.locator('img[src*="HoT_Texture"]').first();
	await expect(hotImg).toBeVisible();
	await expect(hotImg).toHaveClass(/active/);
});

test('Full: account page shows Path of Fire as active', async ({ page }) => {
	await page.goto(BASE + `/account/?key=${FULL_KEY}`, { waitUntil: 'domcontentloaded' });
	await expect(page.locator('h3').first()).toBeVisible({ timeout: 25000 });
	const pofImg = page.locator('img[src*="GW2-PoF"]').first();
	await expect(pofImg).toBeVisible();
	await expect(pofImg).toHaveClass(/active/);
});

test('Full: account page shows End of Dragons as active', async ({ page }) => {
	await page.goto(BASE + `/account/?key=${FULL_KEY}`, { waitUntil: 'domcontentloaded' });
	await expect(page.locator('h3').first()).toBeVisible({ timeout: 25000 });
	const eodImg = page.locator('img[src*="EoD_Texture"]').first();
	await expect(eodImg).toBeVisible();
	await expect(eodImg).toHaveClass(/active/);
});

test('Full: characters page shows at least one character card', async ({ page }) => {
	const pageErrors = await expectNoPageErrors(page);
	await page.goto(BASE + `/characters/?key=${FULL_KEY}`, { waitUntil: 'domcontentloaded' });
	// article.character is the root element of CharacterCard
	await expect(page.locator('article.character').first()).toBeVisible({ timeout: 25000 });
	expect(pageErrors).toEqual([]);
});

test('Full: achievements page shows completed count widget', async ({ page }) => {
	const pageErrors = await expectNoPageErrors(page);
	await page.goto(BASE + `/achievements/?key=${FULL_KEY}`, { waitUntil: 'domcontentloaded' });
	await expect(page.locator('.widgets-group').first()).toBeVisible({ timeout: 25000 });
	// The first widget value is achievements completed — should be a non-zero number
	const value = await page.locator('.widgets-group .widget .value').first().textContent();
	const count = parseInt(value?.trim() ?? '0', 10);
	expect(count).toBeGreaterThan(0);
	expect(pageErrors).toEqual([]);
});

test('Full: daily page loads with API key without errors', async ({ page }) => {
	const pageErrors = await expectNoPageErrors(page);
	await page.goto(BASE + `/daily/?key=${FULL_KEY}`, { waitUntil: 'domcontentloaded' });
	await expect(page.locator('h1').first()).toBeVisible({ timeout: 25000 });
	expect(pageErrors).toEqual([]);
});

test('Full: legendary page loads without errors', async ({ page }) => {
	const pageErrors = await expectNoPageErrors(page);
	await page.goto(BASE + `/legendary/?key=${FULL_KEY}`, { waitUntil: 'domcontentloaded' });
	await expect(page.locator('h1').first()).toBeVisible({ timeout: 25000 });
	expect(pageErrors).toEqual([]);
});

