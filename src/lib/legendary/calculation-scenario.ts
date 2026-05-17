/**
 * Fluent DSL for legendary calculator integration tests.
 *
 * Usage:
 *   CalculationFor('Klobjarne Geirr')
 *     .recipeNeeds(100, 'Shard of Lowland Shore')
 *     .haveToBuy(94, 'Shard of Lowland Shore')
 *     .haveToVendor(6, 'Mursaat Runestone')
 *
 * CalculationFor finds the fixture by matching the item name against
 * __fixtures__/{id}-{slug}/items.json — partial, case-insensitive.
 *
 * Inventory can be injected by item name or item ID:
 *   CalculationFor('Klobjarne Geirr', { inventory: { 'Amalgamated Gemstone': 18 } })
 *   CalculationFor('Klobjarne Geirr', { inventory: { [68063]: 18 } })
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { expect } from 'vitest';

import {
	normalizeRecipeEntry,
	computeLegendaryIngredients,
	type CacheRecipe,
	type ItemSummary,
	type PriceEntry,
	type IngredientRow,
	type CalculatorContext,
	type LegendaryResult,
} from './calculator';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, '__fixtures__');

// ─── Fixture discovery ────────────────────────────────────────────────────────

type FixtureData = {
	slug: string;
	rootItemId: number;
	itemsById: Record<number, ItemSummary>;
	rawRecipes: Record<string, unknown[]>;
	rawPrices: Record<string, { buys?: { unit_price?: number }; sells?: { unit_price?: number } }>;
	rawInventory: Record<string, number>;
};

function loadFixture(slug: string): FixtureData {
	const dir = path.join(FIXTURES_DIR, slug);
	const rootItemId = Number(slug.split('-')[0]);
	return {
		slug,
		rootItemId,
		itemsById: JSON.parse(readFileSync(path.join(dir, 'items.json'), 'utf8')),
		rawRecipes: JSON.parse(readFileSync(path.join(dir, 'recipes.json'), 'utf8')),
		rawPrices: JSON.parse(readFileSync(path.join(dir, 'prices.json'), 'utf8')),
		rawInventory: JSON.parse(readFileSync(path.join(dir, 'inventory.json'), 'utf8')),
	};
}

function findFixtureByName(name: string): FixtureData {
	if (!existsSync(FIXTURES_DIR)) {
		throw new Error(`Fixtures directory not found: ${FIXTURES_DIR}`);
	}
	const lower = name.toLowerCase();
	const dirs = readdirSync(FIXTURES_DIR, { withFileTypes: true })
		.filter((d) => d.isDirectory())
		.map((d) => d.name);

	// First pass: exact slug match (slug part after the ID)
	for (const dir of dirs) {
		const slugPart = dir.replace(/^\d+-/, '');
		if (slugPart === lower.replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')) {
			return loadFixture(dir);
		}
	}

	// Second pass: match by root item name in items.json (partial, case-insensitive)
	for (const dir of dirs) {
		const rootItemId = Number(dir.split('-')[0]);
		if (!Number.isFinite(rootItemId) || rootItemId <= 0) continue;
		try {
			const itemsPath = path.join(FIXTURES_DIR, dir, 'items.json');
			const items: Record<number, ItemSummary> = JSON.parse(readFileSync(itemsPath, 'utf8'));
			const rootItem = items[rootItemId];
			if (rootItem?.name?.toLowerCase().includes(lower)) {
				return loadFixture(dir);
			}
		} catch {
			// skip corrupt fixtures
		}
	}

	// Third pass: substring match in directory slug
	for (const dir of dirs) {
		if (dir.toLowerCase().includes(lower.replace(/\s+/g, '-'))) {
			return loadFixture(dir);
		}
	}

	const available = dirs.join(', ');
	throw new Error(
		`No fixture found for item "${name}". Available fixtures: ${available}\n` +
		`Run: npm run fixtures:legendary <itemId>`
	);
}

// ─── Context builder ──────────────────────────────────────────────────────────

function buildContext(fixture: FixtureData, inventoryInput: Record<string | number, number>): CalculatorContext {
	// Resolve inventory: keys can be item IDs or item names
	const ownedByItem = new Map<number, number>();

	// Start from fixture inventory.json
	for (const [id, count] of Object.entries(fixture.rawInventory)) {
		const numId = Number(id);
		const numCount = Number(count);
		if (numId > 0 && numCount > 0) ownedByItem.set(numId, numCount);
	}

	// Apply caller-provided inventory
	for (const [key, count] of Object.entries(inventoryInput)) {
		const numCount = Number(count);
		if (!Number.isFinite(numCount) || numCount <= 0) continue;

		const numKey = Number(key);
		if (Number.isFinite(numKey) && numKey > 0) {
			// Numeric key = item ID
			ownedByItem.set(numKey, numCount);
		} else {
			// String key = item name — find matching item ID
			const keyLower = String(key).toLowerCase();
			const match = Object.values(fixture.itemsById).find(
				(item) => item.name?.toLowerCase() === keyLower
			);
			if (match) {
				ownedByItem.set(match.id, numCount);
			} else {
				throw new Error(`Inventory item not found in fixture: "${key}"`);
			}
		}
	}

	const recipeCache = new Map<number, CacheRecipe>();
	for (const [id, entries] of Object.entries(fixture.rawRecipes)) {
		const best =
			entries.find((e) => typeof e === 'object' && e !== null && (e as Record<string, unknown>).id === 0) ??
			entries.find((e) => typeof e === 'object' && e !== null && Number((e as Record<string, unknown>).id) > 0) ??
			null;
		const normalized = best ? normalizeRecipeEntry(best) : null;
		if (normalized) recipeCache.set(Number(id), normalized);
	}

	const priceById = new Map<number, PriceEntry>();
	for (const [id, price] of Object.entries(fixture.rawPrices)) {
		priceById.set(Number(id), price as PriceEntry);
	}

	return { recipeCache, itemsById: fixture.itemsById, priceById, ownedByItem };
}

// ─── Row lookup ───────────────────────────────────────────────────────────────

function findRow(
	result: LegendaryResult,
	itemsById: Record<number, ItemSummary>,
	name: string
): IngredientRow | undefined {
	const lower = name.toLowerCase();
	return result.ingredients.find((r) => itemsById[r.id]?.name?.toLowerCase().includes(lower));
}

function requireRow(
	result: LegendaryResult,
	itemsById: Record<number, ItemSummary>,
	name: string,
	context: string
): IngredientRow {
	const row = findRow(result, itemsById, name);
	if (!row) {
		const available = result.ingredients
			.map((r) => itemsById[r.id]?.name ?? `#${r.id}`)
			.join(', ');
		throw new Error(
			`[${context}] Item "${name}" not found in ingredient rows.\nAvailable: ${available}`
		);
	}
	return row;
}

// ─── Fluent scenario ──────────────────────────────────────────────────────────

export type ScenarioOptions = {
	/**
	 * Initial inventory to inject before running the calculation.
	 * Keys can be **item IDs** (numbers) or **item names** (strings, exact match).
	 * Values are item counts.
	 * @example
	 *   { inventory: { 'Amalgamated Gemstone': 18, [68063]: 18 } }
	 */
	inventory?: Record<string | number, number>;
	/**
	 * Price mode used for all cost-related assertions (default: `'buy'`).
	 * - `'buy'`  — uses buy-order prices (cheaper, but may not fill instantly)
	 * - `'sell'` — uses sell-listing prices
	 */
	priceMode?: 'buy' | 'sell';
};

export class CalculationScenario {
	private readonly _fixture: FixtureData;
	private readonly _ctx: CalculatorContext;
	private readonly _result: LegendaryResult;
	private readonly _priceMode: 'buy' | 'sell';

	constructor(fixture: FixtureData, options: ScenarioOptions = {}) {
		this._fixture = fixture;
		this._priceMode = options.priceMode ?? 'buy';
		this._ctx = buildContext(fixture, options.inventory ?? {});
		this._result = computeLegendaryIngredients(fixture.rootItemId, this._ctx);
	}

	// ─── Recipe structure ────────────────────────────────────────────────────

	/**
	 * Asserts the recipe for this legendary was found (recipe tree has children).
	 * @example
	 *   CalculationFor('Kudzu').recipeIsAvailable()
	 */
	recipeIsAvailable(): this {
		expect(this._result.recipeAvailable, 'recipe should be available').toBe(true);
		return this;
	}

	/**
	 * Asserts that the ingredient list contains exactly `count` missing units of `itemName`.
	 * The count is net after subtracting owned inventory passed to `CalculationFor`.
	 * @param count - Expected number of missing units.
	 * @param itemName - Partial, case-insensitive item name match.
	 * @example
	 *   CalculationFor('Kudzu').recipeNeeds(249, 'Mystic Coin')
	 */
	recipeNeeds(count: number, itemName: string): this {
		const row = requireRow(this._result, this._fixture.itemsById, itemName, `recipeNeeds(${count}, '${itemName}')`);
		expect(row.missing, `"${itemName}" missing count`).toBe(count);
		return this;
	}

	/**
	 * Asserts that `itemName` is present anywhere in the ingredient list (any count).
	 * Use this when you don't need to check the exact quantity.
	 * @param itemName - Partial, case-insensitive item name match.
	 * @example
	 *   CalculationFor('Kudzu').recipeHas('Gift of Battle')
	 */
	recipeHas(itemName: string): this {
		requireRow(this._result, this._fixture.itemsById, itemName, `recipeHas('${itemName}')`);
		return this;
	}

	/**
	 * Asserts that `itemName` is NOT present in the ingredient list.
	 * Useful to document behavior where fully-covered inventory items
	 * are omitted from computed missing rows.
	 * @param itemName - Partial, case-insensitive item name match.
	 */
	recipeDoesNotHave(itemName: string): this {
		const row = findRow(this._result, this._fixture.itemsById, itemName);
		expect(row, `"${itemName}" should not be present in ingredient rows`).toBeUndefined();
		return this;
	}

	// ─── Acquisition source assertions ───────────────────────────────────────

	/**
	 * Asserts that the best acquisition method for `itemName` is the **Trading Post**,
	 * and the missing count equals `count`.
	 * @param count - Expected number of missing units to buy.
	 * @param itemName - Partial, case-insensitive item name match.
	 * @example
	 *   CalculationFor('Kudzu').haveToBuy(112, 'Mystic Coin')
	 */
	haveToBuy(count: number, itemName: string): this {
		const row = requireRow(this._result, this._fixture.itemsById, itemName, `haveToBuy(${count}, '${itemName}')`);
		const source = this._priceMode === 'buy' ? row.bestBuySource : row.bestSellSource;
		expect(row.missing, `"${itemName}" missing count`).toBe(count);
		expect(source, `"${itemName}" best source`).toBe('tp');
		return this;
	}

	/**
	 * Asserts that the best acquisition method for `itemName` is **crafting**,
	 * and the missing count equals `count`.
	 * @param count - Expected number of missing units to craft.
	 * @param itemName - Partial, case-insensitive item name match.
	 * @example
	 *   CalculationFor('Kudzu').haveToCraft(1, 'Gift of Fortune')
	 */
	haveToCraft(count: number, itemName: string): this {
		const row = requireRow(this._result, this._fixture.itemsById, itemName, `haveToCraft(${count}, '${itemName}')`);
		const source = this._priceMode === 'buy' ? row.bestBuySource : row.bestSellSource;
		expect(row.missing, `"${itemName}" missing count`).toBe(count);
		expect(source, `"${itemName}" best source`).toBe('craft');
		return this;
	}

	/**
	 * Asserts that the best acquisition method for `itemName` is a **vendor**,
	 * and the missing count equals `count`.
	 *
	 * Note: a vendor unit cost of `0` means the vendor currency is AccountBound
	 * (e.g. Ancient Coins, Karma) — the item is free but not from the Trading Post.
	 * @param count - Expected number of missing units to get from a vendor.
	 * @param itemName - Partial, case-insensitive item name match.
	 * @example
	 *   CalculationFor('Kudzu').haveToVendor(100, 'Mursaat Runestone')
	 */
	haveToVendor(count: number, itemName: string): this {
		const row = requireRow(this._result, this._fixture.itemsById, itemName, `haveToVendor(${count}, '${itemName}')`);
		const source = this._priceMode === 'buy' ? row.bestBuySource : row.bestSellSource;
		expect(row.missing, `"${itemName}" missing count`).toBe(count);
		expect(source, `"${itemName}" best source`).toBe('vendor');
		return this;
	}

	// ─── Vendor free units ───────────────────────────────────────────────────

	/**
	 * Asserts how many units of `itemName` can be obtained **for free** from a vendor
	 * using already-owned TP-eligible currency items.
	 *
	 * Example: if a vendor sells 1 Shard for 3× Amalgamated Gemstone and you own 18,
	 * then `vendorFreeUnitsAre(6, 'Shard of Lowland Shore')`.
	 * @param count - Expected number of freely obtainable units.
	 * @param itemName - Partial, case-insensitive item name match.
	 * @example
	 *   CalculationFor('Klobjarne Geirr', { inventory: { 'Amalgamated Gemstone': 18 } })
	 *     .vendorFreeUnitsAre(6, 'Shard of Lowland Shore')
	 */
	vendorFreeUnitsAre(count: number, itemName: string): this {
		const row = requireRow(this._result, this._fixture.itemsById, itemName, `vendorFreeUnitsAre(${count}, '${itemName}')`);
		expect(row.vendorFreeUnits, `"${itemName}" vendorFreeUnits`).toBe(count);
		return this;
	}

	// ─── Cost assertions ─────────────────────────────────────────────────────

	/**
	 * Asserts the best unit price for `itemName` in copper coins.
	 * Uses the price mode set in `CalculationFor` options (default: `'buy'`).
	 * @param copper - Expected unit price in copper.
	 * @param itemName - Partial, case-insensitive item name match.
	 * @example
	 *   CalculationFor('Kudzu').unitCostIs(150, 'Thermocatalytic Reagent')
	 */
	unitCostIs(copper: number, itemName: string): this {
		const row = requireRow(this._result, this._fixture.itemsById, itemName, `unitCostIs(${copper}, '${itemName}')`);
		const unit = this._priceMode === 'buy' ? row.bestBuyUnit : row.bestSellUnit;
		expect(unit, `"${itemName}" unit cost (copper)`).toBe(copper);
		return this;
	}

	// ─── Raw row access ───────────────────────────────────────────────────────

	/**
	 * Runs a custom assertion callback on the raw `IngredientRow` for `itemName`.
	 * Use this for checks not covered by the other methods.
	 * @param itemName - Partial, case-insensitive item name match.
	 * @param assertion - Callback receiving the full `IngredientRow` object.
	 * @example
	 *   CalculationFor('Kudzu')
	 *     .row('Mursaat Runestone', row => {
	 *       expect(row.vendorBuyUnit).toBe(0);
	 *       expect(row.vendorFreeUnits).toBe(row.missing);
	 *     })
	 */
	row(itemName: string, assertion: (row: IngredientRow) => void): this {
		const row = requireRow(this._result, this._fixture.itemsById, itemName, `row('${itemName}')`);
		assertion(row);
		return this;
	}

	/**
	 * Runs a custom assertion for every ingredient row in the scenario result.
	 * Useful for broad, row-level control checks.
	 */
	eachRow(assertion: (row: IngredientRow, itemName: string) => void): this {
		for (const row of this._result.ingredients) {
			const itemName = this._fixture.itemsById[row.id]?.name ?? `#${row.id}`;
			assertion(row, itemName);
		}
		return this;
	}

	/**
	 * Verifies baseline invariants for every row in the ingredient table.
	 * This gives at least one control condition per computed row.
	 */
	rowsAreConsistent(): this {
		const allowedSources = ['tp', 'craft', 'vendor', 'none'];
		return this.eachRow((row, itemName) => {
			expect(row.required, `[${itemName}] required`).toBeGreaterThan(0);
			expect(row.owned, `[${itemName}] owned`).toBeGreaterThanOrEqual(0);
			expect(row.missing, `[${itemName}] missing`).toBeGreaterThanOrEqual(0);
			expect(row.missing, `[${itemName}] missing <= required`).toBeLessThanOrEqual(row.required);
			expect(row.vendorFreeUnits, `[${itemName}] vendorFreeUnits >= 0`).toBeGreaterThanOrEqual(0);
			expect(row.vendorFreeUnits, `[${itemName}] vendorFreeUnits <= missing`).toBeLessThanOrEqual(row.missing);

			expect(allowedSources, `[${itemName}] bestBuySource`).toContain(row.bestBuySource);
			expect(allowedSources, `[${itemName}] bestSellSource`).toContain(row.bestSellSource);

			if (row.bestBuySource === 'none') {
				expect(row.bestBuyUnit, `[${itemName}] bestBuyUnit`).toBeNull();
			} else {
				expect(row.bestBuyUnit, `[${itemName}] bestBuyUnit present`).not.toBeNull();
			}

			if (row.bestSellSource === 'none') {
				expect(row.bestSellUnit, `[${itemName}] bestSellUnit`).toBeNull();
			} else {
				expect(row.bestSellUnit, `[${itemName}] bestSellUnit present`).not.toBeNull();
			}
		});
	}
}

/**
 * Entry point for a legendary calculator test scenario.
 *
 * Finds the pre-dumped fixture for `itemName` under `__fixtures__/` by matching
 * the item name (partial, case-insensitive), then builds a `CalculatorContext`
 * and runs `computeLegendaryIngredients`. Returns a fluent `CalculationScenario`
 * on which you can chain assertions.
 *
 * **Fixture discovery order:**
 * 1. Exact slug match (e.g. `'klobjarne-geirr'`)
 * 2. Root item name match in `items.json`
 * 3. Substring match in directory slug
 *
 * If no fixture is found, an error is thrown with a list of available fixtures
 * and the command to generate a new one.
 *
 * @param itemName - Legendary item name (partial match, e.g. `'Kudzu'`, `'Klobjarne Geirr'`).
 * @param options  - Optional inventory and price mode overrides.
 *
 * @example
 *   CalculationFor('Klobjarne Geirr')
 *     .recipeNeeds(100, 'Shard of Lowland Shore')
 *     .haveToBuy(94,  'Shard of Lowland Shore')
 *     .haveToVendor(100, 'Mursaat Runestone')
 *
 * @example
 *   CalculationFor('Klobjarne Geirr', { inventory: { 'Amalgamated Gemstone': 18 } })
 *     .vendorFreeUnitsAre(6, 'Shard of Lowland Shore')
 */
export function CalculationFor(itemName: string, options: ScenarioOptions = {}): CalculationScenario {
	const fixture = findFixtureByName(itemName);
	return new CalculationScenario(fixture, options);
}
