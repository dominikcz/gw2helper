/**
 * build-legendary-recipes-pack.mjs
 *
 * Builds a compact recipe pack for legendary calculator usage.
 * The pack contains only recipes reachable from legendary item IDs.
 *
 * Output:
 *   static/data/recipies/legendary-pack.json
 *
 * Usage:
 *   node scripts/build-legendary-recipes-pack.mjs
 */

import fs from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listRecipeBucketFiles } from './lib/recipe-buckets.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = path.resolve(__dirname, '..');
const RECIPES_DIR = path.join(ROOT_DIR, 'static', 'data', 'recipies');
const LEGENDARY_ITEMS_PATH = path.join(ROOT_DIR, 'src', 'api', 'leg.json');
const RECIPES_CACHE_PATH = path.join(ROOT_DIR, 'static', 'legendary_recipes_cache.json');
const OUTPUT_PATH = path.join(RECIPES_DIR, 'legendary-pack.json');

function pickBestRecipeEntry(entries) {
	if (!Array.isArray(entries) || entries.length === 0) return null;
	const custom = entries.find((e) => typeof e === 'object' && e !== null && Number(e.id) === 0);
	if (custom) return custom;
	return entries.find((e) => typeof e === 'object' && e !== null && Number(e.id) > 0) ?? null;
}

async function readLegendaryRootIds() {
	if (!existsSync(LEGENDARY_ITEMS_PATH)) {
		throw new Error(`Missing ${LEGENDARY_ITEMS_PATH}`);
	}
	const raw = await fs.readFile(LEGENDARY_ITEMS_PATH, 'utf-8');
	const items = JSON.parse(raw);
	const fromApi = Array.isArray(items)
		? items
			.filter((item) => item && item.rarity === 'Legendary' && Number(item.id) > 0)
			.map((item) => Number(item.id))
		: [];

	// Also include roots from legendary_recipes_cache.json (wiki-scraped items not in the API)
	const fromCache = [];
	if (existsSync(RECIPES_CACHE_PATH)) {
		try {
			const cacheRaw = await fs.readFile(RECIPES_CACHE_PATH, 'utf-8');
			const cache = JSON.parse(cacheRaw);
			if (cache && Array.isArray(cache.roots)) {
				fromCache.push(...cache.roots.map(Number).filter((id) => Number.isInteger(id) && id > 0));
			}
		} catch {
			// ignore
		}
	}

	const merged = [...new Set([...fromApi, ...fromCache])];
	return merged.filter((id, index, arr) => arr.indexOf(id) === index).sort((a, b) => a - b);
}

async function indexAllRecipes() {
	const files = await listRecipeBucketFiles(RECIPES_DIR);
	/** @type {Map<number, { best: unknown, ingredients: number[] }>} */
	const recipeIndex = new Map();

	for (const fullPath of files) {
		let parsedBucket;
		try {
			parsedBucket = JSON.parse(await fs.readFile(fullPath, 'utf-8'));
		} catch {
			continue;
		}
		const recipesByItemId =
			parsedBucket && typeof parsedBucket === 'object' && parsedBucket.recipesByItemId && typeof parsedBucket.recipesByItemId === 'object'
				? parsedBucket.recipesByItemId
				: null;
		if (!recipesByItemId) continue;

		for (const [id, entries] of Object.entries(recipesByItemId)) {
			const itemId = Number(id);
			if (!Number.isInteger(itemId) || itemId <= 0) continue;

			const best = pickBestRecipeEntry(entries);
			if (!best) continue;

			const ingredients = Array.isArray(best.ingredients)
				? best.ingredients
					.map((ing) => Number(ing?.item_id))
					.filter((ingredientId) => Number.isInteger(ingredientId) && ingredientId > 0)
				: [];

			// Also follow vendor cost items — items obtained by opening a container have
			// the container as a vendor cost; their recipes must be included in the pack
			// so the tree can expand them.
			const vendorCostIds = (best.acquisition?.vendors ?? [])
				.flatMap((v) => v.cost ?? [])
				.map((c) => Number(c?.item_id))
				.filter((id) => Number.isInteger(id) && id > 0);

			// Deduplicate against recipe ingredients
			const allFollowIds = [...new Set([...ingredients, ...vendorCostIds])];

			recipeIndex.set(itemId, { best, ingredients: allFollowIds });
		}
	}

	return recipeIndex;
}

function buildReachableSet(rootIds, recipeIndex, maxDepth = 8) {
	const visited = new Set(rootIds);
	let frontier = [...rootIds];

	for (let depth = 0; depth <= maxDepth && frontier.length > 0; depth++) {
		const nextFrontier = new Set();

		for (const itemId of frontier) {
			const indexed = recipeIndex.get(itemId);
			if (!indexed) continue;

			for (const ingredientId of indexed.ingredients) {
				if (!visited.has(ingredientId)) {
					visited.add(ingredientId);
					nextFrontier.add(ingredientId);
				}
			}
		}

		frontier = [...nextFrontier];
	}

	return visited;
}

async function main() {
	if (!existsSync(RECIPES_DIR)) {
		throw new Error(`Missing ${RECIPES_DIR}`);
	}

	const rootIds = await readLegendaryRootIds();
	const recipeIndex = await indexAllRecipes();
	const reachable = buildReachableSet(rootIds, recipeIndex);

	/** @type {Record<string, unknown>} */
	const recipesByItemId = {};
	for (const itemId of [...reachable].sort((a, b) => a - b)) {
		const indexed = recipeIndex.get(itemId);
		if (!indexed) continue;
		recipesByItemId[String(itemId)] = indexed.best;
	}

	const pack = {
		version: 1,
		generatedAt: new Date().toISOString(),
		maxDepth: 8,
		rootLegendaryIds: rootIds,
		recipesByItemId,
	};

	await fs.mkdir(path.dirname(OUTPUT_PATH), { recursive: true });
	await fs.writeFile(OUTPUT_PATH, JSON.stringify(pack), 'utf-8');

	const stats = await fs.stat(OUTPUT_PATH);
	const mb = (stats.size / (1024 * 1024)).toFixed(2);
	console.log(`[legendary-pack] roots=${rootIds.length}`);
	console.log(`[legendary-pack] recipes=${Object.keys(recipesByItemId).length}`);
	console.log(`[legendary-pack] output=${OUTPUT_PATH}`);
	console.log(`[legendary-pack] size=${stats.size} (${mb} MB)`);
}

main().catch((err) => {
	console.error('[legendary-pack] failed:', err?.message || err);
	process.exit(1);
});
