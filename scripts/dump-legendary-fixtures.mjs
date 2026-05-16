/**
 * dump-legendary-fixtures.mjs
 *
 * Dumps test fixture data for a legendary item from local recipe cache + GW2 API.
 * Saved to src/lib/legendary/__fixtures__/{item-slug}/
 *
 * Files written per item:
 *   recipes.json   — { [itemId]: raw recipe entry[] }
 *   items.json     — { [itemId]: ItemSummary }
 *   prices.json    — { [itemId]: PriceEntry }
 *   inventory.json — { [itemId]: count }  (only when --api-key is provided)
 *
 * Usage:
 *   node scripts/dump-legendary-fixtures.mjs 103815
 *   node scripts/dump-legendary-fixtures.mjs 103815 --api-key=XXXXXXXX-XXXX-...
 *   node scripts/dump-legendary-fixtures.mjs 30686 30699 103815
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { readRecipeEntries } from './lib/recipe-buckets.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const RECIPES_DIR = path.join(ROOT_DIR, 'static', 'data', 'recipies');
const FIXTURES_DIR = path.join(ROOT_DIR, 'src', 'lib', 'legendary', '__fixtures__');
const GW2_API = 'https://api.guildwars2.com';
const API_BATCH_SIZE = 200;
const DELAY_MS = 200;

// ─── CLI ──────────────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
const apiKeyArg = args.find((a) => a.startsWith('--api-key='));
const API_KEY = apiKeyArg ? apiKeyArg.slice('--api-key='.length).trim() : null;
const itemIdArgs = args.filter((a) => !a.startsWith('--') && /^\d+$/.test(a)).map(Number);

if (!itemIdArgs.length) {
	console.error('Usage: node scripts/dump-legendary-fixtures.mjs <itemId> [itemId2 ...] [--api-key=KEY]');
	process.exit(1);
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function gw2Fetch(path, query = {}) {
	const search = new URLSearchParams(query);
	const url = `${GW2_API}${path}?${search.toString()}`;
	const res = await fetch(url);
	if (!res.ok) throw new Error(`GW2 API ${path} → ${res.status}`);
	return res.json();
}

function slugify(name) {
	return name
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
}

function inBatches(arr, size = API_BATCH_SIZE) {
	const out = [];
	const copy = [...arr];
	while (copy.length) out.push(copy.splice(0, size));
	return out;
}

// ─── Recipe tree walker ───────────────────────────────────────────────────────

/**
 * Loads all recipe JSON files reachable from rootId.
 * Returns { recipesByItemId, allItemIds }
 */
async function collectRecipeTree(rootId, maxDepth = 8) {
	/** @type {Map<number, unknown[]>} itemId → raw recipe entries array */
	const recipesByItemId = new Map();
	const visited = new Set([rootId]);
	let frontier = [rootId];

	for (let depth = 0; depth <= maxDepth && frontier.length > 0; depth++) {
		const results = await Promise.all(
			frontier.map(async (id) => {
				const entries = await readRecipeEntries(RECIPES_DIR, id);
				if (!Array.isArray(entries) || !entries.length) return [id, null];
				return [id, entries];
			})
		);

		const nextFrontier = new Set();
		for (const [id, entries] of results) {
			if (!entries) continue;
			recipesByItemId.set(id, entries);

			if (depth < maxDepth) {
				// Find the best entry (wiki/custom id=0 first, then API)
				const best =
					entries.find((e) => typeof e === 'object' && e !== null && Number(e.id) === 0) ??
					entries.find((e) => typeof e === 'object' && e !== null && Number(e.id) > 0) ??
					null;

				if (best && Array.isArray(best.ingredients)) {
					for (const ing of best.ingredients) {
						const ingId = Number(ing?.item_id);
						if (ingId > 0 && !visited.has(ingId)) {
							visited.add(ingId);
							nextFrontier.add(ingId);
						}
					}
				}
			}
		}
		frontier = [...nextFrontier];
	}

	const allItemIds = new Set(visited);
	// Also collect ingredient IDs from all recipes
	for (const entries of recipesByItemId.values()) {
		const best =
			entries.find((e) => typeof e === 'object' && e !== null && Number(e.id) === 0) ??
			entries.find((e) => typeof e === 'object' && e !== null && Number(e.id) > 0) ??
			null;
		if (best && Array.isArray(best.ingredients)) {
			for (const ing of best.ingredients) {
				const ingId = Number(ing?.item_id);
				if (ingId > 0) allItemIds.add(ingId);
			}
		}
		// Also collect vendor cost item IDs (needed for vendorFreeUnits computation)
		if (best?.acquisition?.vendors) {
			for (const vendor of best.acquisition.vendors) {
				for (const cost of vendor.cost ?? []) {
					const costId = Number(cost?.item_id);
					if (costId > 0) allItemIds.add(costId);
				}
			}
		}
	}

	return { recipesByItemId, allItemIds };
}

// ─── GW2 API fetchers ─────────────────────────────────────────────────────────

async function fetchItems(ids) {
	if (!ids.length) return [];
	const results = [];
	for (const batch of inBatches([...ids])) {
		const data = await gw2Fetch('/v2/items', { ids: batch.join(',') }).catch(() => []);
		results.push(...data);
		await sleep(DELAY_MS);
	}
	return results;
}

async function fetchPrices(ids) {
	if (!ids.length) return [];
	const results = [];
	for (const batch of inBatches([...ids])) {
		const data = await gw2Fetch('/v2/commerce/prices', { ids: batch.join(',') }).catch(() => []);
		results.push(...data);
		await sleep(DELAY_MS);
	}
	return results;
}

async function fetchInventory(apiKey) {
	if (!apiKey) return {};
	const query = { access_token: apiKey };

	const [materials, bank, sharedInventory, characters] = await Promise.all([
		gw2Fetch('/v2/account/materials', query).catch(() => []),
		gw2Fetch('/v2/account/bank', query).catch(() => []),
		gw2Fetch('/v2/account/inventory', query).catch(() => []),
		gw2Fetch('/v2/characters', { ...query, page: 0 }).catch(() => []),
	]);

	const owned = {};
	const addItem = (item) => {
		if (!item || !item.id || !item.count) return;
		const id = Number(item.id);
		const count = Number(item.count);
		if (id > 0 && count > 0) owned[id] = (owned[id] || 0) + count;
	};

	for (const item of materials) addItem(item);
	for (const item of bank) addItem(item);
	for (const item of sharedInventory) addItem(item);

	// Characters require separate fetches per character
	if (Array.isArray(characters)) {
		for (const charName of characters) {
			if (typeof charName !== 'string') continue;
			await sleep(DELAY_MS);
			const charData = await gw2Fetch(`/v2/characters/${encodeURIComponent(charName)}/inventory`, query).catch(() => null);
			if (!charData?.bags) continue;
			for (const bag of charData.bags) {
				if (!bag?.inventory) continue;
				for (const item of bag.inventory) addItem(item);
			}
		}
	}

	return owned;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

for (const targetId of itemIdArgs) {
	console.log(`\n═══ Processing item ${targetId} ═══`);

	// 1. Collect recipe tree from local files
	console.log('  Collecting recipe tree from local cache...');
	const { recipesByItemId, allItemIds } = await collectRecipeTree(targetId);
	console.log(`  → ${recipesByItemId.size} recipe files, ${allItemIds.size} item IDs`);

	// 2. Fetch item details from GW2 API
	console.log('  Fetching item details from GW2 API...');
	const itemList = await fetchItems([...allItemIds]);
	const itemsById = {};
	for (const item of itemList) {
		itemsById[item.id] = {
			id: item.id,
			name: item.name,
			icon: item.icon,
			rarity: item.rarity,
			flags: item.flags,
			...(item.binding ? { binding: item.binding } : {}),
			...(item.bound_to ? { bound_to: item.bound_to } : {}),
		};
	}
	console.log(`  → ${Object.keys(itemsById).length} items fetched`);

	// 3. Fetch prices from TP
	console.log('  Fetching prices from Trading Post...');
	const priceList = await fetchPrices([...allItemIds]);
	const pricesById = {};
	for (const p of priceList) {
		pricesById[p.id] = {
			buys: p.buys,
			sells: p.sells,
		};
	}
	console.log(`  → ${Object.keys(pricesById).length} prices fetched`);

	// 4. Optionally fetch inventory
	let inventoryData = {};
	if (API_KEY) {
		console.log('  Fetching inventory from GW2 API...');
		inventoryData = await fetchInventory(API_KEY);
		console.log(`  → ${Object.keys(inventoryData).length} inventory slots`);
	}

	// 5. Determine fixture directory name
	const targetItem = itemsById[targetId];
	const itemName = targetItem?.name ?? String(targetId);
	const slug = `${targetId}-${slugify(itemName)}`;
	const fixtureDir = path.join(FIXTURES_DIR, slug);
	await fs.mkdir(fixtureDir, { recursive: true });

	// 6. Convert recipes map to plain object
	const recipesObj = {};
	for (const [id, entries] of recipesByItemId) {
		recipesObj[id] = entries;
	}

	// 7. Write fixture files
	await fs.writeFile(path.join(fixtureDir, 'recipes.json'), JSON.stringify(recipesObj, null, 2), 'utf8');
	await fs.writeFile(path.join(fixtureDir, 'items.json'), JSON.stringify(itemsById, null, 2), 'utf8');
	await fs.writeFile(path.join(fixtureDir, 'prices.json'), JSON.stringify(pricesById, null, 2), 'utf8');
	await fs.writeFile(path.join(fixtureDir, 'inventory.json'), JSON.stringify(inventoryData, null, 2), 'utf8');

	console.log(`  ✓ Fixture saved to src/lib/legendary/__fixtures__/${slug}/`);
}

console.log('\nDone.');
