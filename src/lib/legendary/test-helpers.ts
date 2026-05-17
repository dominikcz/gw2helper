/**
 * Test helpers for legendary calculator unit tests.
 * Loads fixture data from __fixtures__/{slug}/ and builds a CalculatorContext.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

import {
	normalizeRecipeEntry,
	type CacheRecipe,
	type ItemSummary,
	type PriceEntry,
	type IngredientRow,
	type CalculatorContext,
} from './calculator';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, '__fixtures__');

function normalizedSlugPart(value: string): string {
	return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function listFixtureDirs(): string[] {
	if (!existsSync(FIXTURES_DIR)) return [];
	return readdirSync(FIXTURES_DIR, { withFileTypes: true })
		.filter((d) => d.isDirectory())
		.map((d) => d.name);
}

type RawPriceEntry = {
	buys?: { quantity?: number; unit_price?: number };
	sells?: { quantity?: number; unit_price?: number };
};

/**
 * Builds a CalculatorContext from a fixture directory + optional inventory override.
 * @param slug  Directory name inside __fixtures__/ (e.g. "103815-klobjarne-geirr")
 * @param inventory  Additional owned items to inject, overriding fixture inventory.json values.
 */
export function loadFixtureContext(slug: string, inventory: Record<number, number> = {}): CalculatorContext {
	const dir = path.join(FIXTURES_DIR, slug);
	const rawRecipes: Record<string, unknown[]> = JSON.parse(readFileSync(path.join(dir, 'recipes.json'), 'utf8'));
	const itemsById: Record<number, ItemSummary> = JSON.parse(readFileSync(path.join(dir, 'items.json'), 'utf8'));
	const rawPrices: Record<string, RawPriceEntry> = JSON.parse(readFileSync(path.join(dir, 'prices.json'), 'utf8'));
	const rawInventory: Record<string, number> = JSON.parse(readFileSync(path.join(dir, 'inventory.json'), 'utf8'));

	const recipeCache = new Map<number, CacheRecipe>();
	for (const [id, entries] of Object.entries(rawRecipes)) {
		const best =
			(entries as unknown[]).find((e) => typeof e === 'object' && e !== null && (e as Record<string, unknown>).id === 0) ??
			(entries as unknown[]).find((e) => typeof e === 'object' && e !== null && Number((e as Record<string, unknown>).id) > 0) ??
			null;
		const normalized = best ? normalizeRecipeEntry(best) : null;
		if (normalized) recipeCache.set(Number(id), normalized);
	}

	const priceById = new Map<number, PriceEntry>();
	for (const [id, price] of Object.entries(rawPrices)) {
		priceById.set(Number(id), price as PriceEntry);
	}

	const ownedByItem = new Map<number, number>();
	for (const [id, count] of Object.entries(rawInventory)) {
		const numId = Number(id);
		const numCount = Number(count);
		if (numId > 0 && numCount > 0) ownedByItem.set(numId, numCount);
	}
	for (const [id, count] of Object.entries(inventory)) {
		const numId = Number(id);
		const numCount = Number(count);
		if (numId > 0 && numCount > 0) ownedByItem.set(numId, numCount);
	}

	return { recipeCache, itemsById, priceById, ownedByItem };
}

/** Finds an ingredient row by item ID. */
export function findRowById(rows: IngredientRow[], id: number): IngredientRow | undefined {
	return rows.find((r) => r.id === id);
}

/** Finds an ingredient row by (partial, case-insensitive) item name. */
export function findRowByName(
	rows: IngredientRow[],
	itemsById: Record<number, ItemSummary>,
	name: string
): IngredientRow | undefined {
	return rows.find((r) => itemsById[r.id]?.name?.toLowerCase().includes(name.toLowerCase()));
}

/** Returns true if the fixture directory exists on disk. */
export function fixtureExists(slug: string): boolean {
	return existsSync(path.join(FIXTURES_DIR, slug, 'recipes.json'));
}

/** Returns true if a fixture can be resolved by legendary item name. */
export function fixtureExistsByItemName(name: string): boolean {
	return resolveFixtureSlugByItemName(name) !== null;
}

/** Resolves fixture directory slug for an item name, or null when not found. */
export function resolveFixtureSlugByItemName(name: string): string | null {
	const lower = name.toLowerCase();
	const slugQuery = normalizedSlugPart(name);
	const dirs = listFixtureDirs();

	for (const dir of dirs) {
		const slugPart = dir.replace(/^\d+-/, '');
		if (slugPart === slugQuery) {
			return existsSync(path.join(FIXTURES_DIR, dir, 'recipes.json')) ? dir : null;
		}
	}

	for (const dir of dirs) {
		if (dir.toLowerCase().includes(slugQuery)) {
			return existsSync(path.join(FIXTURES_DIR, dir, 'recipes.json')) ? dir : null;
		}
	}

	for (const dir of dirs) {
		const rootItemId = Number(dir.split('-')[0]);
		if (!Number.isFinite(rootItemId) || rootItemId <= 0) continue;
		try {
			const itemsPath = path.join(FIXTURES_DIR, dir, 'items.json');
			const items: Record<number, ItemSummary> = JSON.parse(readFileSync(itemsPath, 'utf8'));
			const rootItem = items[rootItemId];
			if (rootItem?.name?.toLowerCase().includes(lower)) {
				return existsSync(path.join(FIXTURES_DIR, dir, 'recipes.json')) ? dir : null;
			}
		} catch {
			// ignore malformed fixture directories
		}
	}

	return null;
}

/** Loads fixture context by legendary item name, returning context and resolved metadata. */
export function loadFixtureContextByItemName(
	name: string,
	inventory: Record<number, number> = {}
): { slug: string; rootItemId: number; ctx: CalculatorContext } {
	const slug = resolveFixtureSlugByItemName(name);
	if (!slug) {
		throw new Error(`Fixture not found for item name: "${name}"`);
	}
	const rootItemId = Number(slug.split('-')[0]);
	return {
		slug,
		rootItemId,
		ctx: loadFixtureContext(slug, inventory),
	};
}
