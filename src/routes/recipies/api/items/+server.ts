import { json } from '@sveltejs/kit';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '../../../../../');
const CACHE_PATH = path.join(PROJECT_ROOT, 'scripts/.cache/gw2_all_items.json');
const RECIPES_DIR = path.join(PROJECT_ROOT, 'static/data/recipies');
const RECIPES_BUCKETS_DIR = path.join(RECIPES_DIR, 'buckets');
const BUCKET_SIZE = 2000;

interface CachedItem {
	id: number;
	name: string;
	icon: string;
	rarity: string;
	type: string;
	flags: string[];
	isRecipeScroll?: boolean;
}

type RecipeBucket = {
	recipesByItemId?: Record<string, unknown[]>;
};

function getBucketStart(id: number): number {
	return Math.floor(id / BUCKET_SIZE) * BUCKET_SIZE;
}

function getBucketPath(bucketStart: number): string {
	return path.join(RECIPES_BUCKETS_DIR, `${bucketStart}.json`);
}

function readBucketRecipesByItemId(bucketStart: number): Record<string, unknown[]> {
	const bucketPath = getBucketPath(bucketStart);
	if (!existsSync(bucketPath)) return {};

	try {
		const parsed = JSON.parse(readFileSync(bucketPath, 'utf-8')) as RecipeBucket;
		if (!parsed || typeof parsed !== 'object' || !parsed.recipesByItemId) return {};
		return parsed.recipesByItemId;
	} catch {
		return {};
	}
}

function buildHasRecipeLookup(ids: number[]): Map<number, boolean> {
	const byBucket = new Map<number, number[]>();
	for (const id of ids) {
		const bucketStart = getBucketStart(id);
		const arr = byBucket.get(bucketStart);
		if (arr) arr.push(id);
		else byBucket.set(bucketStart, [id]);
	}

	const hasRecipeById = new Map<number, boolean>();
	for (const [bucketStart, bucketIds] of byBucket.entries()) {
		const recipesByItemId = readBucketRecipesByItemId(bucketStart);
		for (const id of bucketIds) {
			hasRecipeById.set(id, Array.isArray(recipesByItemId[String(id)]));
		}
	}

	return hasRecipeById;
}

// IDs that must never be returned — duplicates, wrong-version items, etc.
const BLOCKED_IDS = new Set<number>([
	45016, // Quip (duplicate, wrong version — use 30693)
	45017, // Quip (duplicate, wrong version — use 30693)
	88567,
	88933,
	88901,
]);

export function GET({ url }: { url: URL }) {
	const q = url.searchParams.get('q') ?? '';
	const rarity = url.searchParams.get('rarity') ?? '';
	const type = url.searchParams.get('type') ?? '';
	const limitParam = url.searchParams.get('limit');
	const limit = limitParam ? Math.max(1, parseInt(limitParam, 10)) : 1000;
	const idsParam = url.searchParams.get('ids') ?? '';

	if (!existsSync(CACHE_PATH)) {
		return json(
			{ error: 'Cache not ready. Run: node scripts/build-items-cache.mjs' },
			{ status: 503 }
		);
	}

	const raw = readFileSync(CACHE_PATH, 'utf-8');
	const allItems: CachedItem[] = JSON.parse(raw);

	// ID lookup mode – return specific items by ID regardless of filters
	if (idsParam) {
		const ids = new Set(idsParam.split(',').map(Number).filter(n => n > 0));
		const hasRecipeById = buildHasRecipeLookup([...ids]);
		const items = allItems
			.filter(item => ids.has(item.id) && !BLOCKED_IDS.has(item.id))
			.map(item => ({
				id: item.id,
				name: item.name,
				icon: item.icon,
				rarity: item.rarity,
				type: item.type,
				hasRecipe: hasRecipeById.get(item.id) ?? false,
			}));
		return json({ items });
	}

	const qTokens = q.toLowerCase().split(/\s+/).filter(Boolean);
	const filtered = allItems.filter((item) => {
		if (!item.name?.trim()) return false;
		if (item.isRecipeScroll) return false;
		if (BLOCKED_IDS.has(item.id)) return false;
		if (qTokens.length > 0) {
			const nameLower = item.name.toLowerCase();
			if (!qTokens.every(token => nameLower.includes(token))) return false;
		}
		if (rarity && item.rarity !== rarity) return false;
		if (type && item.type !== type) return false;
		return true;
	});
	const hasRecipeById = buildHasRecipeLookup(filtered.map((item) => item.id));

	const items = filtered.map((item) => ({
		id: item.id,
		name: item.name,
		icon: item.icon,
		rarity: item.rarity,
		type: item.type,
		hasRecipe: hasRecipeById.get(item.id) ?? false,
	})).sort((a, b) => {
		// Alphabetically by name
		const nameCmp = a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
		if (nameCmp !== 0) return nameCmp;
		// Items with recipes first on ties
		if (a.hasRecipe !== b.hasRecipe) return a.hasRecipe ? -1 : 1;
		// Then by ID ascending (lower ID = original/older item)
		return a.id - b.id;
	}).slice(0, limit);

	return json({ items });
}
