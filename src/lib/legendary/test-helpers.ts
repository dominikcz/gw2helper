/**
 * Test helpers for legendary calculator unit tests.
 * Loads fixture data from __fixtures__/{slug}/ and builds a CalculatorContext.
 */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import Ajv, { type ErrorObject, type ValidateFunction } from 'ajv';

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

const ajv = new Ajv({ allErrors: true, strict: false });

const recipesSchema = {
	type: 'object',
	additionalProperties: {
		type: 'array',
	},
};

const itemsSchema = {
	type: 'object',
	additionalProperties: {
		type: 'object',
		required: ['id', 'name'],
		properties: {
			id: { type: 'number' },
			name: { type: 'string' },
		},
		additionalProperties: true,
	},
};

const pricesSchema = {
	type: 'object',
	additionalProperties: {
		type: 'object',
		additionalProperties: true,
	},
};

const inventorySchema = {
	type: 'object',
	additionalProperties: { type: 'number' },
};

const validateRecipes = ajv.compile(recipesSchema) as ValidateFunction<Record<string, unknown[]>>;
const validateItems = ajv.compile(itemsSchema) as ValidateFunction<Record<number, ItemSummary>>;
const validatePrices = ajv.compile(pricesSchema) as ValidateFunction<Record<string, RawPriceEntry>>;
const validateInventory = ajv.compile(inventorySchema) as ValidateFunction<Record<string, number>>;

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

type FixtureIndexEntry = {
	dir: string;
	slugPartLower: string;
	rootItemId: number;
	hasRecipes: boolean;
	rootItemNameLower?: string;
};

let fixtureIndexCache: FixtureIndexEntry[] | null = null;

function formatAjvErrors(errors: ErrorObject[] | null | undefined): string {
	if (!errors?.length) return 'unknown schema validation error';
	return errors
		.map((e) => `${e.instancePath || '/'} ${e.message ?? 'validation error'}`.trim())
		.join('; ');
}

function parseJsonFile<T>(filePath: string, label: string): T {
	let raw = '';
	try {
		raw = readFileSync(filePath, 'utf8');
	} catch (error) {
		throw new Error(`[${label}] Unable to read ${filePath}: ${String(error)}`);
	}

	try {
		return JSON.parse(raw) as T;
	} catch (error) {
		throw new Error(`[${label}] Invalid JSON in ${filePath}: ${String(error)}`);
	}
}

function parseAndValidateJson<T>(
	filePath: string,
	label: string,
	validator: ValidateFunction<T>
): T {
	const parsed = parseJsonFile<unknown>(filePath, label);
	if (!validator(parsed)) {
		throw new Error(`[${label}] JSON schema validation failed for ${filePath}: ${formatAjvErrors(validator.errors)}`);
	}
	return parsed;
}

function buildFixtureIndex(): FixtureIndexEntry[] {
	return listFixtureDirs().map((dir) => {
		const slugPartLower = dir.replace(/^\d+-/, '').toLowerCase();
		const rootItemId = Number(dir.split('-')[0]);
		const hasRecipes = existsSync(path.join(FIXTURES_DIR, dir, 'recipes.json'));

		let rootItemNameLower: string | undefined;
		if (Number.isFinite(rootItemId) && rootItemId > 0) {
			try {
				const itemsPath = path.join(FIXTURES_DIR, dir, 'items.json');
				const items = parseJsonFile<Record<number, ItemSummary>>(itemsPath, `${dir}/items.json`);
				rootItemNameLower = items[rootItemId]?.name?.toLowerCase();
			} catch {
				// Ignore malformed fixtures when building lookup index.
			}
		}

		return {
			dir,
			slugPartLower,
			rootItemId,
			hasRecipes,
			...(rootItemNameLower ? { rootItemNameLower } : {}),
		};
	});
}

function getFixtureIndex(): FixtureIndexEntry[] {
	if (!fixtureIndexCache) fixtureIndexCache = buildFixtureIndex();
	return fixtureIndexCache;
}

export function resetFixtureIndexCache(): void {
	fixtureIndexCache = null;
}

/**
 * Builds a CalculatorContext from a fixture directory + optional inventory override.
 * @param slug  Directory name inside __fixtures__/ (e.g. "103815-klobjarne-geirr")
 * @param inventory  Additional owned items to inject, overriding fixture inventory.json values.
 */
export function loadFixtureContext(slug: string, inventory: Record<number, number> = {}): CalculatorContext {
	const dir = path.join(FIXTURES_DIR, slug);
	const rawRecipes = parseAndValidateJson(path.join(dir, 'recipes.json'), `${slug}/recipes.json`, validateRecipes);
	const itemsById = parseAndValidateJson(path.join(dir, 'items.json'), `${slug}/items.json`, validateItems);
	const rawPrices = parseAndValidateJson(path.join(dir, 'prices.json'), `${slug}/prices.json`, validatePrices);
	const rawInventory = parseAndValidateJson(path.join(dir, 'inventory.json'), `${slug}/inventory.json`, validateInventory);

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
	const indexed = getFixtureIndex().filter((entry) => entry.hasRecipes);

	const exactSlug = indexed.find((entry) => entry.slugPartLower === slugQuery);
	if (exactSlug) return exactSlug.dir;

	const slugSubstring = indexed.find((entry) => entry.slugPartLower.includes(slugQuery));
	if (slugSubstring) return slugSubstring.dir;

	const rootNameMatch = indexed.find((entry) => entry.rootItemNameLower?.includes(lower));
	if (rootNameMatch) return rootNameMatch.dir;

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
