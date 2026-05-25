/**
 * Pure calculation functions for legendary item cost estimation.
 * No framework dependencies — safe to import in unit tests.
 */

import type {
	RecipeTreeNode,
	ItemSummary,
	IngredientRow,
	CacheIngredient,
	VendorCost,
	VendorAcquisition,
	ItemAcquisition,
	CacheRecipe,
	PriceEntry,
	CalculatorContext,
	LegendaryResult,
} from './calculator-types';

export type {
	RecipeTreeNode,
	ItemSummary,
	IngredientRow,
	CacheIngredient,
	VendorCost,
	VendorAcquisition,
	ItemAcquisition,
	CacheRecipe,
	PriceEntry,
	CalculatorContext,
	LegendaryResult,
};

// ─── Low-level guards ─────────────────────────────────────────────────────────

export const isFinitePositiveInt = (value: unknown): value is number => {
	const n = Number(value);
	return Number.isFinite(n) && Number.isInteger(n) && n > 0;
};

export const isFinitePositiveNumber = (value: unknown): value is number => {
	const n = Number(value);
	return Number.isFinite(n) && n > 0;
};

export const isTradingPostEligible = (item?: ItemSummary): boolean => {
	if (!item) return false;
	if (item.binding || item.bound_to) return false;
	const flags = item.flags || [];
	const blocked = new Set(['AccountBound', 'SoulbindOnAcquire', 'SoulBindOnAcquire', 'SoulbindOnUse', 'SoulBindOnUse']);
	return !flags.some((f) => blocked.has(String(f)));
};

export const isSelfReferentialRecipe = (itemId: number, recipe: CacheRecipe | undefined): boolean => {
	if (!recipe || !Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) return false;
	return recipe.ingredients.some((ingredient) => Number(ingredient.item_id) === itemId);
};

// ─── Normalization ─────────────────────────────────────────────────────────────

export function normalizeAcquisition(rawAcq: unknown): ItemAcquisition | null {
	if (!rawAcq || typeof rawAcq !== 'object') return null;
	const acqObj = rawAcq as Record<string, unknown>;
	if (!Array.isArray(acqObj.vendors)) return null;
	const vendors: VendorAcquisition[] = acqObj.vendors
		.map((v: unknown) => {
			if (!v || typeof v !== 'object') return null;
			const vo = v as Record<string, unknown>;
			const name = typeof vo.name === 'string' ? vo.name.trim() : '';
			if (!name) return null;
			const cost: VendorCost[] = Array.isArray(vo.cost)
				? vo.cost
						.map((c: unknown) => {
							if (!c || typeof c !== 'object') return null;
							const co = c as Record<string, unknown>;
							const amount = Number(co.amount);
							const item_name = typeof co.item_name === 'string' ? co.item_name.trim() : '';
							if (!Number.isFinite(amount) || amount <= 0 || !item_name) return null;
							const icon_url = typeof co.icon_url === 'string' && co.icon_url && !co.icon_url.includes('wiki.guildwars2.com') ? co.icon_url : undefined;
							const item_id = isFinitePositiveInt(co.item_id) ? Number(co.item_id) : undefined;
							return { amount, item_name, ...(icon_url ? { icon_url } : {}), ...(item_id ? { item_id } : {}) };
						})
						.filter((c): c is VendorCost => c !== null)
				: [];
			const gold_cost = typeof vo.gold_cost === 'number' && vo.gold_cost > 0 ? vo.gold_cost : undefined;
			if (!cost.length && !gold_cost) return null;
			return { name, cost, ...(gold_cost !== undefined ? { gold_cost } : {}) };
		})
		.filter((v): v is VendorAcquisition => v !== null);
	return vendors.length ? { vendors } : null;
}

export function normalizeRecipeEntry(entry: unknown): CacheRecipe | null {
	if (!entry || typeof entry !== 'object') return null;
	const raw = entry as Record<string, unknown>;
	const outputId = Number(raw.output_item_id);
	if (!isFinitePositiveInt(outputId)) return null;

	const ingredients: CacheIngredient[] = Array.isArray(raw.ingredients)
		? raw.ingredients
				.map((ing: unknown) => {
					if (!ing || typeof ing !== 'object') return null;
					const i = ing as Record<string, unknown>;
					const item_id = Number(i.item_id);
					const count = Number(i.count);
					if (!isFinitePositiveInt(item_id)) return null;
					if (!Number.isFinite(count) || count <= 0) return null;
					return { item_id, count, name: null };
				})
				.filter((i): i is CacheIngredient => i !== null)
		: [];

	const acquisition = normalizeAcquisition(raw.acquisition);
	const entryId = Number(raw.id ?? -1);
	const source: CacheRecipe['source'] = ingredients.length === 0 ? 'terminal' : entryId === 0 ? 'wiki' : 'api';

	return {
		source,
		output_item_id: outputId,
		recipe_id: entryId > 0 ? entryId : null,
		output_item_count: isFinitePositiveNumber(raw.output_item_count) ? Number(raw.output_item_count) : 1,
		ingredients,
		acquisition,
	};
}

// ─── Tree building ─────────────────────────────────────────────────────────────

function buildTreeNode(
	itemId: number,
	neededCount: number,
	stack: Set<number>,
	ownedPool: Map<number, number>,
	isRootNode: boolean,
	recipeCache: Map<number, CacheRecipe>
): RecipeTreeNode {
	if (stack.has(itemId)) {
		return { id: itemId, count: neededCount, cycle: true, children: [] };
	}

	const available = isRootNode ? 0 : (ownedPool.get(itemId) || 0);
	const consumed = isRootNode ? 0 : Math.min(available, neededCount);
	if (!isRootNode && consumed > 0) {
		ownedPool.set(itemId, available - consumed);
	}
	const remainingToCraft = Math.max(0, neededCount - consumed);

	const recipe = recipeCache.get(itemId);
	if (
		remainingToCraft <= 0 ||
		!recipe ||
		!Array.isArray(recipe.ingredients) ||
		recipe.ingredients.length === 0 ||
		recipe.source === 'terminal' ||
		isSelfReferentialRecipe(itemId, recipe)
	) {
		const isTerminal = recipe?.source === 'terminal';
		const leafAcquisition = isTerminal ? (recipe!.acquisition ?? null) : undefined;
		let acqChildren: RecipeTreeNode[] = [];
		let acqGoldCost: number | undefined;
		if (isTerminal && remainingToCraft > 0 && leafAcquisition?.vendors?.length) {
			const firstVendor = leafAcquisition.vendors[0];
			for (const c of firstVendor.cost) {
				acqChildren.push({
					id: c.item_id ?? 0,
					count: c.amount * neededCount,
					name: c.item_name,
					...(c.icon_url ? { icon_url: c.icon_url } : {}),
					children: [],
				});
			}
			if (firstVendor.gold_cost) {
				acqGoldCost = firstVendor.gold_cost;
			}
		}
		return {
			id: itemId,
			count: neededCount,
			source: recipe?.source,
			...(leafAcquisition !== undefined ? { acquisition: leafAcquisition } : {}),
			...(acqGoldCost !== undefined ? { gold_cost: acqGoldCost } : {}),
			children: acqChildren,
		};
	}

	const outputCount = Math.max(0.000001, Number(recipe.output_item_count || 1));
	const craftsNeeded = Math.ceil(remainingToCraft / outputCount);
	const nextStack = new Set(stack);
	nextStack.add(itemId);

	const children: RecipeTreeNode[] = [];
	for (const ingredient of recipe.ingredients) {
		const ingId = Number(ingredient.item_id);
		const ingCount = Number(ingredient.count || 0);
		if (!Number.isFinite(ingCount) || ingCount <= 0) continue;
		if (!Number.isFinite(ingId) || ingId <= 0) {
			if (ingredient.name) {
				children.push({ id: 0, count: craftsNeeded * ingCount, name: ingredient.name, children: [] });
			}
			continue;
		}
		if (ingId === itemId) continue;
		children.push(buildTreeNode(ingId, craftsNeeded * ingCount, nextStack, ownedPool, false, recipeCache));
	}

	if (!children.length) {
		return { id: itemId, count: neededCount, source: recipe.source, children: [] };
	}

	return {
		id: itemId,
		count: neededCount,
		recipeId: recipe.recipe_id ?? undefined,
		source: recipe.source,
		children,
	};
}

function collectTreeIds(node: RecipeTreeNode | null, out: Set<number>): void {
	if (!node) return;
	if (node.id > 0) out.add(node.id);
	for (const child of node.children) collectTreeIds(child, out);
}

/** Build the recipe tree and collect all item IDs referenced in it. */
export function buildLegendaryTree(
	targetItemId: number,
	recipeCache: Map<number, CacheRecipe>,
	ownedByItem: Map<number, number>
): { recipeTree: RecipeTreeNode; treeIds: Set<number> } {
	const recipeTree = buildTreeNode(targetItemId, 1, new Set<number>(), new Map(ownedByItem), true, recipeCache);
	const treeIds = new Set<number>();
	collectTreeIds(recipeTree, treeIds);
	return { recipeTree, treeIds };
}

// ─── Required items accumulation ──────────────────────────────────────────────

/** Returns net required counts per item after consuming owned inventory. */
export function accumulateRequiredItems(
	targetItemId: number,
	recipeCache: Map<number, CacheRecipe>,
	itemsById: Record<number, ItemSummary>,
	ownedByItem: Map<number, number>
): Map<number, number> {
	const requiredByItem = new Map<number, number>();
	const ownedPool = new Map(ownedByItem);

	const recurse = (itemId: number, neededCount: number, isRootNode: boolean, stack: Set<number>): void => {
		if (!Number.isFinite(neededCount) || neededCount <= 0) return;
		if (stack.has(itemId)) return;

		const available = isRootNode ? 0 : (ownedPool.get(itemId) || 0);
		const consumed = isRootNode ? 0 : Math.min(available, neededCount);
		if (!isRootNode && consumed > 0) ownedPool.set(itemId, available - consumed);
		const remaining = neededCount - consumed;
		if (remaining <= 0) return;

		const recipe = recipeCache.get(itemId);
		const malformedSelfRecipe = isSelfReferentialRecipe(itemId, recipe);
		const validIngredients = (recipe?.ingredients || []).filter((ing) => {
			const ingId = Number(ing.item_id);
			const ingCount = Number(ing.count || 0);
			return Number.isFinite(ingId) && ingId > 0 && Number.isFinite(ingCount) && ingCount > 0 && ingId !== itemId;
		});
		const hasRecipe = Boolean(recipe && recipe.source !== 'terminal' && !malformedSelfRecipe && validIngredients.length);
		const item = itemsById[itemId];

		if (!isRootNode && (!hasRecipe || isTradingPostEligible(item))) {
			requiredByItem.set(itemId, (requiredByItem.get(itemId) || 0) + remaining);
			return;
		}

		if (!hasRecipe || !recipe) {
			requiredByItem.set(itemId, (requiredByItem.get(itemId) || 0) + remaining);
			return;
		}

		const outputCount = Math.max(0.000001, Number(recipe.output_item_count || 1));
		const craftsNeeded = Math.ceil(remaining / outputCount);
		const nextStack = new Set(stack);
		nextStack.add(itemId);
		for (const ing of validIngredients) {
			recurse(Number(ing.item_id), craftsNeeded * Number(ing.count), false, nextStack);
		}
	};

	recurse(targetItemId, 1, true, new Set<number>());
	return requiredByItem;
}

// ─── Price IDs collection ─────────────────────────────────────────────────────

/** Returns the set of item IDs that need TP price data. */
export function collectPriceIds(
	recipeCache: Map<number, CacheRecipe>,
	requiredByItem: Map<number, number>,
	itemsById: Record<number, ItemSummary>
): Set<number> {
	const priceIdsSet = new Set<number>(requiredByItem.keys());

	const collectDeps = (itemId: number, stack: Set<number>): void => {
		if (stack.has(itemId)) return;
		const recipe = recipeCache.get(itemId);
		if (!recipe || recipe.source === 'terminal' || !recipe.ingredients?.length) return;
		const nextStack = new Set(stack);
		nextStack.add(itemId);
		for (const ing of recipe.ingredients) {
			const ingId = Number(ing.item_id);
			const ingCount = Number(ing.count || 0);
			if (!Number.isFinite(ingId) || ingId <= 0 || !Number.isFinite(ingCount) || ingCount <= 0) continue;
			priceIdsSet.add(ingId);
			collectDeps(ingId, nextStack);
		}
	};

	for (const itemId of requiredByItem.keys()) collectDeps(itemId, new Set<number>());

	for (const recipe of recipeCache.values()) {
		if (recipe.source !== 'terminal') continue;
		for (const vendor of recipe.acquisition?.vendors ?? []) {
			for (const cost of vendor.cost ?? []) {
				if (cost.item_id && cost.item_id > 0 && isTradingPostEligible(itemsById[cost.item_id])) {
					priceIdsSet.add(cost.item_id);
				}
			}
		}
	}

	return priceIdsSet;
}

// ─── Ingredient row computation ───────────────────────────────────────────────

export function pickBestUnit(
	tpUnit: number | null,
	craftUnit: number | null,
	vendorUnit: number | null = null
): { unit: number | null; source: 'tp' | 'craft' | 'vendor' | 'none' } {
	const candidates: Array<{ unit: number; source: 'tp' | 'craft' | 'vendor' }> = [];
	if (tpUnit != null) candidates.push({ unit: tpUnit, source: 'tp' });
	if (craftUnit != null) candidates.push({ unit: craftUnit, source: 'craft' });
	if (vendorUnit != null) candidates.push({ unit: vendorUnit, source: 'vendor' });
	if (!candidates.length) return { unit: null, source: 'none' };
	return candidates.reduce((best, c) => (c.unit < best.unit ? c : best));
}

export function estimateCraftUnitCost(
	itemId: number,
	mode: 'buy' | 'sell',
	ctx: CalculatorContext,
	stack: Set<number> = new Set<number>()
): number | null {
	if (stack.has(itemId)) return null;
	const recipe = ctx.recipeCache.get(itemId);
	if (!recipe || recipe.source === 'terminal' || !recipe.ingredients?.length || isSelfReferentialRecipe(itemId, recipe))
		return null;

	const outputCount = Math.max(0.000001, Number(recipe.output_item_count || 1));
	const nextStack = new Set(stack);
	nextStack.add(itemId);

	let totalCost = 0;
	let hasKnownCost = false;
	for (const ingredient of recipe.ingredients) {
		const ingId = Number(ingredient.item_id);
		const ingCount = Number(ingredient.count || 0);
		if (!Number.isFinite(ingId) || ingId <= 0 || !Number.isFinite(ingCount) || ingCount <= 0) continue;

		const ingItem = ctx.itemsById[ingId];
		const ingPrice = ctx.priceById.get(ingId);
		const tpUnit = mode === 'buy' ? (ingPrice?.buys?.unit_price ?? null) : (ingPrice?.sells?.unit_price ?? null);

		let unit: number | null = null;
		if (isTradingPostEligible(ingItem)) {
			unit = tpUnit;
		} else {
			unit = estimateCraftUnitCost(ingId, mode, ctx, nextStack) ?? tpUnit;
		}

		if (unit == null || !Number.isFinite(unit) || unit < 0) continue;
		totalCost += unit * ingCount;
		hasKnownCost = true;
	}

	if (!hasKnownCost) return null;
	const perUnit = totalCost / outputCount;
	return Number.isFinite(perUnit) && perUnit >= 0 ? perUnit : null;
}

export function computeVendorGoldUnit(
	acquisition: ItemAcquisition | null,
	missing: number,
	mode: 'buy' | 'sell',
	ctx: CalculatorContext
): number | null {
	if (!acquisition?.vendors?.length) return null;
	let minVendorCostPerUnit: number | null = null;

	for (const vendor of acquisition.vendors) {
		let totalCost = (vendor.gold_cost ?? 0) * missing;
		let hasPricedComponent = (vendor.gold_cost ?? 0) > 0;
		let vendorResolvable = true;

		for (const c of vendor.cost ?? []) {
			if (!c.item_id) continue;
			const costItemInfo = ctx.itemsById[c.item_id];
			if (!costItemInfo) { vendorResolvable = false; break; }
			if (!isTradingPostEligible(costItemInfo)) { hasPricedComponent = true; continue; }

			const costItemPrice = ctx.priceById.get(c.item_id);
			const unitPrice = mode === 'buy' ? costItemPrice?.buys?.unit_price : costItemPrice?.sells?.unit_price;
			if (unitPrice == null) continue;

			const totalNeeded = missing * c.amount;
			const alreadyOwned = ctx.ownedByItem.get(c.item_id) || 0;
			const toBuy = Math.max(0, totalNeeded - alreadyOwned);
			totalCost += toBuy * unitPrice;
			hasPricedComponent = true;
		}

		if (!vendorResolvable || !hasPricedComponent) continue;
		const perUnit = totalCost / missing;
		if (minVendorCostPerUnit === null || perUnit < minVendorCostPerUnit) minVendorCostPerUnit = perUnit;
	}

	return minVendorCostPerUnit;
}

export function computeVendorFreeUnits(
	acquisition: ItemAcquisition | null,
	missing: number,
	ctx: Pick<CalculatorContext, 'itemsById' | 'ownedByItem'>
): number {
	if (!acquisition?.vendors?.length || missing <= 0) return 0;
	let maxFreeUnits = 0;

	for (const vendor of acquisition.vendors) {
		let freeFromVendor = missing;
		let vendorResolvable = true;

		for (const c of vendor.cost ?? []) {
			if (!c.item_id) continue;
			const costItemInfo = ctx.itemsById[c.item_id];
			if (!costItemInfo) { vendorResolvable = false; break; }
			if (!isTradingPostEligible(costItemInfo)) continue;
			const owned = ctx.ownedByItem.get(c.item_id) || 0;
			freeFromVendor = Math.min(freeFromVendor, Math.floor(owned / c.amount));
		}

		if (!vendorResolvable) continue;
		maxFreeUnits = Math.max(maxFreeUnits, Math.min(missing, Math.max(0, freeFromVendor)));
	}

	return maxFreeUnits;
}

/** Compute all ingredient rows from pre-built required counts + full context. */
export function computeIngredientRows(
	requiredByItem: Map<number, number>,
	ctx: CalculatorContext
): IngredientRow[] {
	return [...requiredByItem.entries()]
		.map(([id, required]) => {
			const needed = Math.max(0, required);
			if (needed <= 0) return null;
			const owned = ctx.ownedByItem.get(id) || 0;
			const missing = needed;
			const item = ctx.itemsById[id];
			const price = ctx.priceById.get(id);
			const tpEligible = isTradingPostEligible(item);
			const buyUnit = price?.buys?.unit_price ?? null;
			const sellUnit = price?.sells?.unit_price ?? null;
			let craftBuyUnit = estimateCraftUnitCost(id, 'buy', ctx);
			let craftSellUnit = estimateCraftUnitCost(id, 'sell', ctx);

			const craftRecipe = ctx.recipeCache.get(id);
			if (craftBuyUnit != null && craftRecipe && craftRecipe.source !== 'terminal' && craftRecipe.ingredients?.length) {
				const outputCount = Math.max(0.000001, Number(craftRecipe.output_item_count || 1));
				const craftsNeeded = Math.ceil(missing / outputCount);
				const allIngredientsOwned = craftRecipe.ingredients.every((ing) => {
					const ingId = Number(ing.item_id);
					const ingCount = Number(ing.count || 0);
					if (!ingId || ingId <= 0 || ingCount <= 0) return true;
					return (ctx.ownedByItem.get(ingId) || 0) >= craftsNeeded * ingCount;
				});
				if (allIngredientsOwned) { craftBuyUnit = 0; craftSellUnit = 0; }
			}

			const cachedEntry = ctx.recipeCache.get(id);
			const acquisition = cachedEntry?.source === 'terminal' ? (cachedEntry?.acquisition ?? null) : null;

			const vendorBuyUnit = computeVendorGoldUnit(acquisition, missing, 'buy', ctx);
			const vendorSellUnit = computeVendorGoldUnit(acquisition, missing, 'sell', ctx);
			const vendorFreeUnits = computeVendorFreeUnits(acquisition, missing, ctx);

			const bestBuy = pickBestUnit(tpEligible ? buyUnit : null, craftBuyUnit, vendorBuyUnit);
			const bestSell = pickBestUnit(tpEligible ? sellUnit : null, craftSellUnit, vendorSellUnit);

			return {
				id, required: needed, owned, missing,
				buyUnit, sellUnit, craftBuyUnit, craftSellUnit,
				vendorBuyUnit, vendorSellUnit, vendorFreeUnits,
				bestBuyUnit: bestBuy.unit, bestSellUnit: bestSell.unit,
				bestBuySource: bestBuy.source, bestSellSource: bestSell.source,
				tpEligible, acquisition,
			} satisfies IngredientRow;
		})
		.filter((row): row is IngredientRow => row !== null)
		.sort((a, b) => b.missing - a.missing || a.id - b.id);
}

// ─── Main entry point ─────────────────────────────────────────────────────────

/**
 * Compute the full legendary result given a pre-built context.
 * Use this in unit tests — pass fixture data as ctx.
 */
export function computeLegendaryIngredients(
	targetItemId: number,
	ctx: CalculatorContext
): LegendaryResult {
	const { recipeTree } = buildLegendaryTree(targetItemId, ctx.recipeCache, ctx.ownedByItem);
	const recipeAvailable = recipeTree.children.length > 0;

	const requiredByItem = recipeAvailable
		? accumulateRequiredItems(targetItemId, ctx.recipeCache, ctx.itemsById, ctx.ownedByItem)
		: new Map<number, number>();

	const ingredients = computeIngredientRows(requiredByItem, ctx);

	return { recipeTree, recipeAvailable, ingredients };
}

// ─── Utility ─────────────────────────────────────────────────────────────────

export const inBatches = <T>(input: T[], size = 200): T[][] => {
	const copy = [...input];
	const out: T[][] = [];
	while (copy.length) out.push(copy.splice(0, size));
	return out;
};

export const appendItems = (map: Map<number, number>, items: Array<{ id: number; count?: number }>) => {
	for (const item of items) {
		const itemId = Number(item.id);
		const count = Number(item.count || 0);
		if (!Number.isFinite(itemId) || itemId <= 0 || !Number.isFinite(count) || count <= 0) continue;
		map.set(itemId, (map.get(itemId) || 0) + count);
	}
};

export const toObjById = (items: ItemSummary[]): Record<number, ItemSummary> => {
	const out: Record<number, ItemSummary> = {};
	for (const item of items) out[item.id] = item;
	return out;
};

export const mapToObj = (source: Map<number, number>): Record<number, number> => {
	const out: Record<number, number> = {};
	for (const [id, value] of source.entries()) {
		if (!Number.isFinite(id) || id <= 0 || !Number.isFinite(value) || value <= 0) continue;
		out[id] = value;
	}
	return out;
};
