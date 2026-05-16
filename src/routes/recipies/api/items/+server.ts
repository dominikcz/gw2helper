import { json } from '@sveltejs/kit';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '../../../../../');
const CACHE_PATH = path.join(PROJECT_ROOT, 'scripts/.cache/gw2_all_items.json');
const RECIPES_DIR = path.join(PROJECT_ROOT, 'static/recipies');

interface CachedItem {
	id: number;
	name: string;
	icon: string;
	rarity: string;
	type: string;
	flags: string[];
	isRecipeScroll?: boolean;
}

function getRecipePath(id: number, baseDir: string): string {
	const digits = String(id).split('');
	return path.join(baseDir, ...digits, `${id}.json`);
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
		const items = allItems
			.filter(item => ids.has(item.id) && !BLOCKED_IDS.has(item.id))
			.map(item => ({
				id: item.id,
				name: item.name,
				icon: item.icon,
				rarity: item.rarity,
				type: item.type,
				hasRecipe: existsSync(getRecipePath(item.id, RECIPES_DIR)),
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

	const items = filtered.map((item) => ({
		id: item.id,
		name: item.name,
		icon: item.icon,
		rarity: item.rarity,
		type: item.type,
		hasRecipe: existsSync(getRecipePath(item.id, RECIPES_DIR)),
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
