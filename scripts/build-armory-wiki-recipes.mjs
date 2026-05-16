/**
 * build-armory-wiki-recipes.mjs
 *
 * Builds recipe files for all legendary armory items and their ingredients
 * (maximum 3 levels deep), using wiki-utils.mjs — the same parsing logic
 * as the recipe editor UI.
 *
 * For each item:
 *  1. Skip if already has a custom (id=0) recipe saved and --force is not set
 *  2. Fetch wiki recipe via fetchWikiRecipe + fetchWikiAcquisition
 *  3. Resolve ingredient names → item IDs via local items cache (name lookup)
 *     and wiki SMW as fallback
 *  4. Replace wiki thumbnail icon_urls with GW2 API render URLs from items cache
 *  5. Merge into static/recipies/<d1>/<d2>/.../id.json  (append id=0 entry)
 *
 * Usage:
 *   node scripts/build-armory-wiki-recipes.mjs           # all armory items, 3 levels
 *   node scripts/build-armory-wiki-recipes.mjs 76584     # single item + its ingredients
 *   GW2W_MAX_DEPTH=1 node scripts/build-armory-wiki-recipes.mjs   # only top-level
 *   GW2W_FORCE=1 node scripts/build-armory-wiki-recipes.mjs       # overwrite existing
 */

import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	throttledFetch,
	fetchWikiRecipe,
	fetchWikiAcquisition,
	wikiResolvePageByGameId,
	wikiSearchByName,
	wikiResolveGameIdByPage,
	WIKI_DELAY_MS,
} from './lib/wiki-utils.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const RECIPES_DIR = path.join(ROOT_DIR, 'static', 'recipies');
const ITEMS_CACHE = path.join(ROOT_DIR, 'scripts', '.cache', 'gw2_all_items.json');
const GW2_API = 'https://api.guildwars2.com';
const MAX_DEPTH = Number(process.env.GW2W_MAX_DEPTH ?? 3);
const FORCE = process.env.GW2W_FORCE === '1';
const API_BATCH_SIZE = 200;

// ─── Items cache ─────────────────────────────────────────────────────────────

/** @type {Map<string, { id: number; icon: string | null; rarity: string; type: string }>} name → item */
const itemsByName = new Map();
/** @type {Map<number, { name: string; icon: string | null; rarity: string; type: string }>} id → item */
const itemsById = new Map();

async function loadItemsCache() {
	if (!existsSync(ITEMS_CACHE)) {
		console.error('[cache] Items cache not found. Run: node scripts/build-items-cache.mjs');
		process.exit(1);
	}
	const raw = await fs.readFile(ITEMS_CACHE, 'utf-8');
	const items = JSON.parse(raw);
	for (const item of items) {
		itemsByName.set(item.name.toLowerCase(), item);
		itemsById.set(item.id, item);
	}
	console.log(`[cache] Loaded ${items.length} items`);
}

/** Resolve item ID from name — first tries local cache, then wiki SMW */
const nameToIdCache = new Map(); // wiki fallback cache

async function resolveItemId(name) {
	const lower = name.toLowerCase();
	const cached = itemsByName.get(lower);
	if (cached) return cached.id;

	if (nameToIdCache.has(lower)) return nameToIdCache.get(lower);

	// Wiki SMW fallback
	const id = await wikiResolveGameIdByPage(name).catch(() => null);
	nameToIdCache.set(lower, id ?? null);
	return id ?? null;
}

/** Replace wiki thumbnail icon_urls with GW2 API render URLs from items cache */
function enrichAcquisitionIcons(acquisition) {
	if (!acquisition?.vendors) return;
	for (const vendor of acquisition.vendors) {
		for (const cost of vendor.cost ?? []) {
			if (!cost.item_name) continue;
			const item = itemsByName.get(cost.item_name.toLowerCase());
			if (item?.icon) cost.icon_url = item.icon;
		}
	}
}

// ─── Recipe file helpers ──────────────────────────────────────────────────────

function recipePath(itemId) {
	const digits = String(itemId).split('');
	return path.join(RECIPES_DIR, ...digits, `${itemId}.json`);
}

async function readRecipeFile(itemId) {
	const p = recipePath(itemId);
	if (!existsSync(p)) return [];
	try {
		return JSON.parse(await fs.readFile(p, 'utf-8'));
	} catch {
		return [];
	}
}

async function writeRecipeFile(itemId, recipes) {
	const p = recipePath(itemId);
	await fs.mkdir(path.dirname(p), { recursive: true });
	await fs.writeFile(p, JSON.stringify(recipes), 'utf-8');
}

/** Returns true if the file already has a custom (id=0) wiki recipe */
function hasCustomRecipe(recipes) {
	return recipes.some(r => Number(r.id) === 0);
}

// ─── GW2 API helpers ─────────────────────────────────────────────────────────

async function fetchLegendaryArmoryIds() {
	const data = await throttledFetch(`${GW2_API}/v2/legendaryarmory?ids=all`, 0);
	if (!Array.isArray(data)) throw new Error('Failed to fetch /v2/legendaryarmory');
	return data.map(e => Number(e?.id)).filter(id => id > 0);
}

async function fetchItemNames(ids) {
	const missing = ids.filter(id => id > 0 && !itemsById.has(id));
	if (!missing.length) return;
	for (let i = 0; i < missing.length; i += API_BATCH_SIZE) {
		const batch = missing.slice(i, i + API_BATCH_SIZE);
		const data = await throttledFetch(`${GW2_API}/v2/items?ids=${batch.join(',')}`, 0).catch(() => []);
		if (Array.isArray(data)) {
			for (const item of data) {
				if (!item?.id) continue;
				const entry = { name: item.name, icon: item.icon ?? null, rarity: item.rarity ?? '', type: item.type ?? '' };
				itemsById.set(Number(item.id), entry);
				if (item.name) itemsByName.set(item.name.toLowerCase(), { ...entry, id: Number(item.id) });
			}
		}
	}
}

// ─── Core processing ──────────────────────────────────────────────────────────

const pageTitleCache = new Map(); // itemId → pageTitle | null

async function resolvePageTitle(itemId) {
	if (pageTitleCache.has(itemId)) return pageTitleCache.get(itemId);

	let title = await wikiResolvePageByGameId(itemId).catch(() => null);
	if (!title) {
		const entry = itemsById.get(itemId);
		if (entry?.name) title = await wikiSearchByName(entry.name).catch(() => null);
	}
	pageTitleCache.set(itemId, title ?? null);
	return title ?? null;
}

/**
 * Processes one item: fetches wiki recipe + acquisition, resolves ingredient IDs,
 * enriches icon_urls, saves to recipe file.
 * Returns array of ingredient item IDs that should be processed at depth+1.
 */
async function processItem(itemId, depth, rootProgress = null) {
	const existing = await readRecipeFile(itemId);

	const indent = '  '.repeat(depth);
	const progressStr = rootProgress
		? `[${rootProgress.current}/${rootProgress.total} ${((rootProgress.current / rootProgress.total) * 100).toFixed(1)}%] `
		: '';

	if (!FORCE && hasCustomRecipe(existing)) {
		// Already done — but still return ingredient IDs for BFS
		if (depth === 0) {
			await fetchItemNames([itemId]);
			const displayName = itemsById.get(itemId)?.name ?? `#${itemId}`;
			console.log(`${indent}${progressStr}[d=${depth}] id=${itemId} "${displayName}" (skipped)`);
		}
		const custom = existing.find(r => Number(r.id) === 0);
		return (custom?.ingredients ?? []).map(i => i.item_id).filter(Boolean);
	}

	await fetchItemNames([itemId]);
	const itemEntry = itemsById.get(itemId);
	const displayName = itemEntry?.name ?? `#${itemId}`;
	console.log(`${indent}${progressStr}[d=${depth}] id=${itemId} "${displayName}"`);

	const pageTitle = await resolvePageTitle(itemId);
	if (!pageTitle) {
		console.log(`${indent}  → no wiki page`);
		return [];
	}

	// Fetch recipe + acquisition in parallel
	const [wikiRecipe, acquisition] = await Promise.all([
		fetchWikiRecipe(pageTitle, itemId).catch(() => null),
		fetchWikiAcquisition(pageTitle).catch(() => null),
	]);

	if (!wikiRecipe && !acquisition) {
		console.log(`${indent}  → no recipe/acquisition on wiki`);
		return [];
	}

	// Resolve ingredient names → IDs
	const ingredients = [];
	const rawIngs = wikiRecipe?.ingredients ?? [];

	for (const ing of rawIngs) {
		const count = ing.count ?? 1;
		// Already has an ID (from wiki output_item_id)
		if (ing.item_id && Number(ing.item_id) > 0) {
			ingredients.push({ item_id: Number(ing.item_id), count });
			continue;
		}
		if (ing.name) {
			const resolvedId = await resolveItemId(ing.name);
			if (resolvedId && resolvedId > 0) {
				ingredients.push({ item_id: resolvedId, count });
			} else {
				// keep with id=0 so it's visible in editor
				ingredients.push({ item_id: 0, count, _name: ing.name });
				console.log(`${indent}  ⚠ unresolved ingredient: "${ing.name}"`);
			}
		}
	}

	// Enrich vendor icon_urls with GW2 API icons
	if (acquisition) enrichAcquisitionIcons(acquisition);

	// Build custom recipe entry (id=0 = wiki/custom)
	const customEntry = {
		id: 0,
		type: wikiRecipe?.recipeType ?? '',
		output_item_id: itemId,
		output_item_count: wikiRecipe?.outputCount ?? 1,
		time_to_craft_ms: 0,
		disciplines: wikiRecipe?.disciplines ?? [],
		min_rating: 0,
		flags: ['wiki'],
		ingredients,
		...(acquisition ? { acquisition } : {}),
	};

	// Merge: remove old id=0 entry, add fresh one, keep API entries
	const merged = [
		...existing.filter(r => Number(r.id) !== 0),
		customEntry,
	];
	await writeRecipeFile(itemId, merged);

	const ingStr = ingredients.length ? `${ingredients.length} ing` : 'no ingredients';
	const acqStr = acquisition ? `, acquisition` : '';
	console.log(`${indent}  → saved (${ingStr}${acqStr})`);

	return ingredients.map(i => i.item_id).filter(id => id > 0);
}

// ─── DFS tree traversal ───────────────────────────────────────────────────────

/** Recursively processes an item and all its ingredients up to MAX_DEPTH. */
async function processTree(itemId, depth, visited, rootProgress = null) {
	if (visited.has(itemId)) return;
	visited.add(itemId);

	const ingredientIds = await processItem(itemId, depth, rootProgress);

	if (depth < MAX_DEPTH) {
		for (const ingId of ingredientIds) {
			await processTree(ingId, depth + 1, visited);
		}
	}
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
	const t0 = Date.now();
	console.log('=== Armory Wiki Recipes Builder ===');
	console.log(`Max depth: ${MAX_DEPTH}, Force: ${FORCE}`);
	console.log();

	await loadItemsCache();

	// Seed IDs: CLI args or all legendary armory
	const cliIds = process.argv.slice(2).map(Number).filter(n => n > 0 && Number.isFinite(n));
	let seedIds;
	if (cliIds.length) {
		seedIds = cliIds;
		console.log(`[seed] Using ${seedIds.length} CLI id(s): ${seedIds.join(', ')}`);
	} else {
		seedIds = await fetchLegendaryArmoryIds();
		console.log(`[seed] ${seedIds.length} legendary armory items`);
	}
	console.log();

	// Shared visited set — ingredients shared across multiple root items are processed only once
	const visited = new Set();
	const rootTotal = seedIds.length;
	let processed = 0;

	for (const rootId of seedIds) {
		processed++;
		const rootProgress = { current: processed, total: rootTotal };
		if (visited.has(rootId)) {
			// Already processed as an ingredient of an earlier root — just show progress
			await fetchItemNames([rootId]);
			const displayName = itemsById.get(rootId)?.name ?? `#${rootId}`;
			console.log(`[${processed}/${rootTotal} ${((processed / rootTotal) * 100).toFixed(1)}%] [d=0] id=${rootId} "${displayName}" (already processed)`);
			continue;
		}
		await processTree(rootId, 0, visited, rootProgress);
	}

	const elapsed = Date.now() - t0;
	const hh = String(Math.floor(elapsed / 3600000)).padStart(2, '0');
	const mm = String(Math.floor((elapsed % 3600000) / 60000)).padStart(2, '0');
	const ss = String(Math.floor((elapsed % 60000) / 1000)).padStart(2, '0');
	console.log();
	console.log(`=== Done in ${hh}:${mm}:${ss} — processed ${visited.size} items ===`);
}

main().catch(err => {
	console.error(err);
	process.exit(1);
});
