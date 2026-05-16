export const ssr = false;

import { base } from '$app/paths';
import type { PageLoad } from './$types';
import type { CharacterWithItems, ExpandedItem } from '$lib/types/gw2-api';

type RecipeTreeNode = {
	id: number;
	count: number;
	recipeId?: number;
	source?: 'api' | 'wiki' | 'terminal';
	cycle?: boolean;
	name?: string | null;
	icon_url?: string;
	gold_cost?: number;
	acquisition?: ItemAcquisition | null;
	children: RecipeTreeNode[];
};

type ItemSummary = {
	id: number;
	name?: string;
	icon?: string;
	rarity?: string;
	flags?: string[];
	binding?: string;
	bound_to?: string;
};

type IngredientRow = {
	id: number;
	required: number;
	owned: number;
	missing: number;
	buyUnit: number | null;
	sellUnit: number | null;
	craftBuyUnit: number | null;
	craftSellUnit: number | null;
	vendorBuyUnit: number | null;
	vendorSellUnit: number | null;
	vendorFreeUnits: number;
	bestBuyUnit: number | null;
	bestSellUnit: number | null;
	bestBuySource: 'tp' | 'craft' | 'vendor' | 'none';
	bestSellSource: 'tp' | 'craft' | 'vendor' | 'none';
	tpEligible: boolean;
	acquisition: ItemAcquisition | null;
};

type CacheIngredient = {
	item_id: number | null;
	count: number;
	name?: string | null;
};

type VendorCost = {
	amount: number;
	item_name: string;
	icon_url?: string;
	item_id?: number;
};

type VendorAcquisition = {
	name: string;
	cost: VendorCost[];
	gold_cost?: number;
};

type ItemAcquisition = {
	vendors: VendorAcquisition[];
};

type CacheRecipe = {
	source: 'api' | 'wiki' | 'terminal';
	output_item_id: number;
	recipe_id: number | null;
	output_item_count?: number;
	wiki_page?: string;
	ingredients: CacheIngredient[];
	acquisition?: ItemAcquisition | null;
};

type LegendaryDetailsData = {
	targetItemId: number;
	targetItem: ItemSummary | null;
	recipeTree: RecipeTreeNode | null;
	recipeAvailable: boolean;
	ingredients: IngredientRow[];
	itemsById: Record<number, ItemSummary>;
	ownedById: Record<number, number>;
};

const BATCH_SIZE = 200;

function recipeFileUrl(itemId: number): string {
	return `${base}/recipies/${String(itemId).split('').join('/')}/${itemId}.json`;
}

const isFinitePositiveInt = (value: unknown): value is number => {
	const n = Number(value);
	return Number.isFinite(n) && Number.isInteger(n) && n > 0;
};

const isFinitePositiveNumber = (value: unknown): value is number => {
	const n = Number(value);
	return Number.isFinite(n) && n > 0;
};

function normalizeAcquisition(rawAcq: unknown): ItemAcquisition | null {
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
							const icon_url = typeof co.icon_url === 'string' && co.icon_url ? co.icon_url : undefined;
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

function normalizeRecipeEntry(entry: unknown): CacheRecipe | null {
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
	// id=0 = custom/wiki, id>0 = GW2 API; no ingredients = terminal (vendor/acquisition only)
	const entryId = Number(raw.id ?? -1);
	const source: CacheRecipe['source'] = ingredients.length === 0 ? 'terminal' : (entryId === 0 ? 'wiki' : 'api');

	return {
		source,
		output_item_id: outputId,
		recipe_id: entryId > 0 ? entryId : null,
		output_item_count: isFinitePositiveNumber(raw.output_item_count) ? Number(raw.output_item_count) : 1,
		ingredients,
		acquisition,
	};
}

async function prefetchRecipeTree(
	fetchFn: (input: string) => Promise<Response>,
	rootId: number,
	maxDepth = 8
): Promise<Map<number, CacheRecipe>> {
	const cache = new Map<number, CacheRecipe>();
	const visited = new Set<number>([rootId]);
	let frontier = [rootId];

	for (let depth = 0; depth <= maxDepth && frontier.length > 0; depth++) {
		const results = await Promise.all(
			frontier.map(async (id): Promise<[number, CacheRecipe | null]> => {
				const res = await fetchFn(recipeFileUrl(id)).catch(() => null);
				if (!res?.ok) return [id, null];
				const entries: unknown = await res.json().catch(() => null);
				if (!Array.isArray(entries) || !entries.length) return [id, null];
				// Prefer custom entry (id=0), fallback to first API entry (id>0)
				const custom = entries.find((e) => typeof e === 'object' && e !== null && Number((e as Record<string, unknown>).id) === 0);
				const api = entries.find((e) => typeof e === 'object' && e !== null && Number((e as Record<string, unknown>).id) > 0);
				const best = custom ?? api ?? null;
				return [id, best ? normalizeRecipeEntry(best) : null];
			})
		);

		const nextFrontier = new Set<number>();
		for (const [id, recipe] of results) {
			if (!recipe) continue;
			cache.set(id, recipe);
			if (depth < maxDepth) {
				for (const ing of recipe.ingredients) {
					const ingId = Number(ing.item_id);
					if (ingId > 0 && !visited.has(ingId)) {
						visited.add(ingId);
						nextFrontier.add(ingId);
					}
				}
			}
		}
		frontier = [...nextFrontier];
	}

	return cache;
}

const inBatches = <T>(input: T[], size = BATCH_SIZE): T[][] => {
	const copy = [...input];
	const out: T[][] = [];
	while (copy.length) {
		out.push(copy.splice(0, size));
	}
	return out;
};

const appendItems = (map: Map<number, number>, items: Array<{ id: number; count?: number }>) => {
	for (const item of items) {
		const itemId = Number(item.id);
		const count = Number(item.count || 0);
		if (!Number.isFinite(itemId) || itemId <= 0 || !Number.isFinite(count) || count <= 0) continue;
		map.set(itemId, (map.get(itemId) || 0) + count);
	}
};

const collectTreeIds = (node: RecipeTreeNode | null, out: Set<number>) => {
	if (!node) return;
	if (node.id > 0) out.add(node.id);
	for (const child of node.children) {
		collectTreeIds(child, out);
	}
};

const toObjById = (items: ItemSummary[]): Record<number, ItemSummary> => {
	const out: Record<number, ItemSummary> = {};
	for (const item of items) {
		out[item.id] = item;
	}
	return out;
};

const mapToObj = (source: Map<number, number>): Record<number, number> => {
	const out: Record<number, number> = {};
	for (const [id, value] of source.entries()) {
		if (!Number.isFinite(id) || id <= 0 || !Number.isFinite(value) || value <= 0) continue;
		out[id] = value;
	}
	return out;
};

const isTradingPostEligible = (item?: ItemSummary): boolean => {
	if (!item) return false;
	if (item.binding || item.bound_to) return false;
	const flags = item.flags || [];
	const blocked = new Set(['AccountBound', 'SoulbindOnAcquire', 'SoulBindOnAcquire', 'SoulbindOnUse', 'SoulBindOnUse']);
	return !flags.some((f) => blocked.has(String(f)));
};

export const load: PageLoad = async ({ parent, params, fetch }) => {
	const { apiService, apiLang } = (await parent()) as {
		apiService: {
			getApiKey: () => string;
			items: (ids: string) => Promise<ItemSummary[]>;
			materials: () => Promise<ExpandedItem[]>;
			bank: () => Promise<ExpandedItem[]>;
			sharedInventory: () => Promise<ExpandedItem[]>;
			charactersItems: () => Promise<CharacterWithItems[]>;
		};
		apiLang?: string;
	};

	const key = apiService.getApiKey();
	const targetItemId = Number(params.id);
	if (!key || !Number.isFinite(targetItemId) || targetItemId <= 0) {
		return { targetItemId, details: null };
	}

	const detailsPromise = (async (): Promise<LegendaryDetailsData> => {

	const fetchGw2 = async <T>(path: string, query: Record<string, string | number> = {}): Promise<T> => {
		const search = new URLSearchParams();
		search.set('access_token', key);
		if (apiLang) search.set('lang', apiLang);
		for (const [k, v] of Object.entries(query)) {
			search.set(k, String(v));
		}
		const url = `https://api.guildwars2.com${path}?${search.toString()}`;
		const response = await fetch(url);
		if (!response.ok) throw new Error(`Failed ${path}: ${response.status}`);
		return (await response.json()) as T;
	};

	const recipeCache = await prefetchRecipeTree(fetch, targetItemId);

	const recipeForItem = (itemId: number): CacheRecipe | undefined => {
		return recipeCache.get(itemId);
	};

	const isSelfReferentialRecipe = (itemId: number, recipe: CacheRecipe | undefined): boolean => {
		if (!recipe || !Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) return false;
		return recipe.ingredients.some((ingredient) => Number(ingredient.item_id) === itemId);
	};

	const buildTreeFromCache = (
		itemId: number,
		neededCount: number,
		stack: Set<number>,
		ownedPool: Map<number, number>,
		isRootNode = false
	): RecipeTreeNode => {
		if (stack.has(itemId)) {
			return { id: itemId, count: neededCount, cycle: true, children: [] };
		}

		const available = isRootNode ? 0 : (ownedPool.get(itemId) || 0);
		const consumed = isRootNode ? 0 : Math.min(available, neededCount);
		if (!isRootNode && consumed > 0) {
			ownedPool.set(itemId, available - consumed);
		}
		const remainingToCraft = Math.max(0, neededCount - consumed);

		const recipe = recipeForItem(itemId);
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
				// Vendors are OR alternatives — show only the first vendor's cost in the tree.
				// The full list of options is visible in the ingredients table.
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
				// Unresolved ingredient (e.g. generic currency/slot) — show as leaf with name
				if (ingredient.name) {
					children.push({
						id: 0,
						count: craftsNeeded * ingCount,
						name: ingredient.name,
						children: [],
					});
				}
				continue;
			}
			if (ingId === itemId) continue;
			children.push(buildTreeFromCache(ingId, craftsNeeded * ingCount, nextStack, ownedPool, false));
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
	};

	const targetItem = ((await apiService.items(String(targetItemId))) || [])[0] || null;

	const [materials, bank, sharedInventory, characterItems] = await Promise.all([
		apiService.materials(),
		apiService.bank(),
		apiService.sharedInventory(),
		apiService.charactersItems(),
	]);

	const ownedByItem = new Map<number, number>();
	appendItems(ownedByItem, materials);
	appendItems(ownedByItem, bank);
	appendItems(ownedByItem, sharedInventory);
	for (const character of characterItems) {
		appendItems(ownedByItem, character._items || []);
	}

	const recipeTree = buildTreeFromCache(targetItemId, 1, new Set<number>(), new Map(ownedByItem), true);
	const recipeAvailable = recipeTree.children.length > 0;

	const treeIds = new Set<number>();
	collectTreeIds(recipeTree, treeIds);
	const allItemIds = [...treeIds].filter((id) => Number.isFinite(id) && id > 0);

	const itemList = (
		await Promise.all(
			inBatches(allItemIds).map((batch) => apiService.items(batch.join(',')).catch(() => [] as ItemSummary[]))
		)
	).flat();
	const itemsById = toObjById(itemList);

	const requiredByItem = new Map<number, number>();
	if (recipeAvailable) {
		const ownedPool = new Map(ownedByItem);
		const accumulateRequired = (itemId: number, neededCount: number, isRootNode: boolean, stack: Set<number>) => {
			if (!Number.isFinite(neededCount) || neededCount <= 0) return;
			if (stack.has(itemId)) return;

			const available = isRootNode ? 0 : (ownedPool.get(itemId) || 0);
			const consumed = isRootNode ? 0 : Math.min(available, neededCount);
			if (!isRootNode && consumed > 0) {
				ownedPool.set(itemId, available - consumed);
			}
			const remaining = neededCount - consumed;
			if (remaining <= 0) return;

			const recipe = recipeForItem(itemId);
			const malformedSelfRecipe = isSelfReferentialRecipe(itemId, recipe);
			const validIngredients = (recipe?.ingredients || []).filter((ingredient) => {
				const ingId = Number(ingredient.item_id);
				const ingCount = Number(ingredient.count || 0);
				return Number.isFinite(ingId) && ingId > 0 && Number.isFinite(ingCount) && ingCount > 0 && ingId !== itemId;
			});
			const hasRecipe = Boolean(recipe && recipe.source !== 'terminal' && !malformedSelfRecipe && validIngredients.length);
			const item = itemsById[itemId];

			if (!isRootNode && (!hasRecipe || isTradingPostEligible(item))) {
				requiredByItem.set(itemId, (requiredByItem.get(itemId) || 0) + remaining);
				return;
			}

			if (!hasRecipe) {
				requiredByItem.set(itemId, (requiredByItem.get(itemId) || 0) + remaining);
				return;
			}

			if (!recipe) {
				requiredByItem.set(itemId, (requiredByItem.get(itemId) || 0) + remaining);
				return;
			}

			const outputCount = Math.max(0.000001, Number(recipe.output_item_count || 1));
			const craftsNeeded = Math.ceil(remaining / outputCount);
			const nextStack = new Set(stack);
			nextStack.add(itemId);
			for (const ingredient of validIngredients) {
				const ingId = Number(ingredient.item_id);
				const ingCount = Number(ingredient.count || 0);
				accumulateRequired(ingId, craftsNeeded * ingCount, false, nextStack);
			}
		};

		accumulateRequired(targetItemId, 1, true, new Set<number>());
	}

	const priceIdsSet = new Set<number>(requiredByItem.keys());
	const collectRecipeDependencyIds = (itemId: number, stack: Set<number>) => {
		if (stack.has(itemId)) return;
		const recipe = recipeForItem(itemId);
		if (!recipe || recipe.source === 'terminal' || !Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) return;

		const nextStack = new Set(stack);
		nextStack.add(itemId);
		for (const ingredient of recipe.ingredients) {
			const ingId = Number(ingredient.item_id);
			const ingCount = Number(ingredient.count || 0);
			if (!Number.isFinite(ingId) || ingId <= 0 || !Number.isFinite(ingCount) || ingCount <= 0) continue;
			priceIdsSet.add(ingId);
			collectRecipeDependencyIds(ingId, nextStack);
		}
	};

	for (const itemId of requiredByItem.keys()) {
		collectRecipeDependencyIds(itemId, new Set<number>());
	}

	// Also add vendor cost item IDs from terminal recipes so computeVendorGoldUnit can price them.
	// Only include TP-eligible items — non-tradeable items (Ancient Coin, Karma tokens etc.)
	// are treated as free, so fetching their TP price would only produce 404 noise.
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

	const priceIds = [...priceIdsSet];
	const prices = (
		await Promise.all(
			inBatches(priceIds).map((batch) =>
				fetchGw2<Array<{ id: number; buys?: { unit_price: number }; sells?: { unit_price: number } }>>('/v2/commerce/prices', {
					ids: batch.join(','),
				}).catch(() => [])
			)
		)
	).flat();
	const priceById = new Map<number, { buys?: { unit_price: number }; sells?: { unit_price: number } }>();
	for (const price of prices) {
		priceById.set(price.id, price);
	}

	const estimateCraftUnitCost = (
		itemId: number,
		mode: 'buy' | 'sell',
		stack: Set<number> = new Set<number>()
	): number | null => {
		if (stack.has(itemId)) return null;
		const recipe = recipeForItem(itemId);
		if (
			!recipe ||
			recipe.source === 'terminal' ||
			!Array.isArray(recipe.ingredients) ||
			recipe.ingredients.length === 0 ||
			isSelfReferentialRecipe(itemId, recipe)
		)
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

			const ingItem = itemsById[ingId];
			const ingPrice = priceById.get(ingId);
			const tpUnit = mode === 'buy' ? ingPrice?.buys?.unit_price ?? null : ingPrice?.sells?.unit_price ?? null;

			let unit: number | null = null;
			if (isTradingPostEligible(ingItem)) {
				// Opportunity cost: if the ingredient is tradeable, value it at TP instead of chaining more crafting.
				unit = tpUnit;
			} else {
				unit = estimateCraftUnitCost(ingId, mode, nextStack) ?? tpUnit;
			}

			if (unit == null || !Number.isFinite(unit) || unit < 0) continue;
			totalCost += unit * ingCount;
			hasKnownCost = true;
		}

		if (!hasKnownCost) return null;

		const perUnit = totalCost / outputCount;
		if (!Number.isFinite(perUnit) || perUnit < 0) return null;
		return perUnit;
	};

	const pickBestUnit = (
		tpUnit: number | null,
		craftUnit: number | null,
		vendorUnit: number | null = null
	): { unit: number | null; source: 'tp' | 'craft' | 'vendor' | 'none' } => {
		const candidates: Array<{ unit: number; source: 'tp' | 'craft' | 'vendor' }> = [];
		if (tpUnit != null) candidates.push({ unit: tpUnit, source: 'tp' });
		if (craftUnit != null) candidates.push({ unit: craftUnit, source: 'craft' });
		if (vendorUnit != null) candidates.push({ unit: vendorUnit, source: 'vendor' });
		if (!candidates.length) return { unit: null, source: 'none' };
		return candidates.reduce((best, c) => c.unit < best.unit ? c : best);
	};

	const ingredients: IngredientRow[] = [...requiredByItem.entries()]
		.map(([id, required]) => {
			// `requiredByItem` is already net demand after consuming owned items,
			// so this list represents what still needs to be obtained.
			const needed = Math.max(0, required);
			if (needed <= 0) return null;
			const owned = ownedByItem.get(id) || 0;
			const missing = needed;
			const item = itemsById[id];
			const price = priceById.get(id);
			const tpEligible = isTradingPostEligible(item);
			const buyUnit = price?.buys?.unit_price ?? null;
			const sellUnit = price?.sells?.unit_price ?? null;
			let craftBuyUnit = estimateCraftUnitCost(id, 'buy');
			let craftSellUnit = estimateCraftUnitCost(id, 'sell');

			// If all recipe ingredients are already in the player's inventory for the
			// required number of crafts, the effective craft cost is 0 (nothing to buy).
			const craftRecipe = recipeCache.get(id);
			if (craftBuyUnit != null && craftRecipe && craftRecipe.source !== 'terminal' && craftRecipe.ingredients?.length) {
				const outputCount = Math.max(0.000001, Number(craftRecipe.output_item_count || 1));
				const craftsNeeded = Math.ceil(missing / outputCount);
				const allIngredientsOwned = craftRecipe.ingredients.every((ing) => {
					const ingId = Number(ing.item_id);
					const ingCount = Number(ing.count || 0);
					if (!ingId || ingId <= 0 || ingCount <= 0) return true;
					return (ownedByItem.get(ingId) || 0) >= craftsNeeded * ingCount;
				});
				if (allIngredientsOwned) {
					craftBuyUnit = 0;
					craftSellUnit = 0;
				}
			}

			const cachedEntry = recipeCache.get(id);
			const acquisition = cachedEntry?.source === 'terminal' ? (cachedEntry?.acquisition ?? null) : null;

			// Compute vendor gold cost: for each vendor, sum TP prices of TP-eligible cost items.
			// Use the cheapest vendor option (including any explicit gold_cost).
			// AccountBound/unpriced components are excluded from the estimate
			// (treated as "free" / obtained through gameplay).
			const computeVendorGoldUnit = (mode: 'buy' | 'sell'): number | null => {
				if (!acquisition?.vendors?.length) return null;
				let minVendorCostPerUnit: number | null = null;
				for (const vendor of acquisition.vendors) {
					// Start with total cost = fixed gold/karma per unit × missing units
					let totalCost = (vendor.gold_cost ?? 0) * missing;
					let hasPricedComponent = (vendor.gold_cost ?? 0) > 0;
					let vendorResolvable = true;
					for (const c of vendor.cost ?? []) {
						if (!c.item_id) continue;
						const costItemInfo = itemsById[c.item_id];
						if (!costItemInfo) {
							// Item info not in cache — this vendor option uses an unknown item
							// (e.g. a one-time reward loot item like "Discounted Shard").
							// Can't determine gold equivalent, so skip this entire vendor option.
							vendorResolvable = false;
							break;
						}
						if (!isTradingPostEligible(costItemInfo)) {
							// Known non-TP item (e.g. Ancient Coin): earned through gameplay,
							// not purchasable with gold. Treat as free for gold-cost purposes.
							hasPricedComponent = true;
							continue;
						}
						const costItemPrice = priceById.get(c.item_id);
						const unitPrice = mode === 'buy' ? costItemPrice?.buys?.unit_price : costItemPrice?.sells?.unit_price;
						if (unitPrice == null) continue;
						// Only price items that still need to be bought (subtract owned inventory)
						const totalNeeded = missing * c.amount;
						const alreadyOwned = ownedByItem.get(c.item_id) || 0;
						const toBuy = Math.max(0, totalNeeded - alreadyOwned);
						totalCost += toBuy * unitPrice;
						hasPricedComponent = true;
					}
					if (!vendorResolvable || !hasPricedComponent) continue;
					// Convert total back to effective per-unit cost
					const perUnit = totalCost / missing;
					if (minVendorCostPerUnit === null || perUnit < minVendorCostPerUnit) minVendorCostPerUnit = perUnit;
				}
				return minVendorCostPerUnit;
			};

			const vendorBuyUnit = computeVendorGoldUnit('buy');
			const vendorSellUnit = computeVendorGoldUnit('sell');

			// Calculate how many units can be obtained for free via vendor using only owned items.
			// Used to optimize mixed strategies: free vendor units reduce TP/craft cost.
			const computeVendorFreeUnits = (): number => {
				if (!acquisition?.vendors?.length || missing <= 0) return 0;
				let maxFreeUnits = 0;
				for (const vendor of acquisition.vendors) {
					let freeFromVendor = missing;
					let vendorResolvable = true;
					for (const c of vendor.cost ?? []) {
						if (!c.item_id) continue; // no item_id (Karma etc.) — treat as unlimited free
						const costItemInfo = itemsById[c.item_id];
						if (!costItemInfo) { vendorResolvable = false; break; }
						if (!isTradingPostEligible(costItemInfo)) continue; // non-TP item — treat as unlimited free
						// TP-eligible item: how many units can we make with what we own?
						const owned = ownedByItem.get(c.item_id) || 0;
						freeFromVendor = Math.min(freeFromVendor, Math.floor(owned / c.amount));
					}
					if (!vendorResolvable) continue;
					maxFreeUnits = Math.max(maxFreeUnits, Math.min(missing, Math.max(0, freeFromVendor)));
				}
				return maxFreeUnits;
			};
			const vendorFreeUnits = computeVendorFreeUnits();

			const bestBuy = pickBestUnit(tpEligible ? buyUnit : null, craftBuyUnit, vendorBuyUnit);
			const bestSell = pickBestUnit(tpEligible ? sellUnit : null, craftSellUnit, vendorSellUnit);

			return {
				id,
				required: needed,
				owned,
				missing,
				buyUnit,
				sellUnit,
				craftBuyUnit,
				craftSellUnit,
				vendorBuyUnit,
				vendorSellUnit,
				vendorFreeUnits,
				bestBuyUnit: bestBuy.unit,
				bestSellUnit: bestSell.unit,
				bestBuySource: bestBuy.source,
				bestSellSource: bestSell.source,
				tpEligible,
				acquisition,
			};
		})
		.filter((row): row is IngredientRow => row !== null)
		.sort((a, b) => b.missing - a.missing || a.id - b.id);

	const details: LegendaryDetailsData = {
		targetItemId,
		targetItem,
		recipeTree,
		recipeAvailable,
		ingredients,
		itemsById,
		ownedById: mapToObj(ownedByItem),
	};

	return details;
	})();

	return { targetItemId, details: detailsPromise };
};
