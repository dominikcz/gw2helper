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
	bestBuyUnit: number | null;
	bestSellUnit: number | null;
	bestBuySource: 'tp' | 'craft' | 'none';
	bestSellSource: 'tp' | 'craft' | 'none';
	tpEligible: boolean;
};

type CacheIngredient = {
	item_id: number | null;
	count: number;
	name?: string | null;
};

type CacheRecipe = {
	source: 'api' | 'wiki' | 'terminal';
	output_item_id: number;
	recipe_id: number | null;
	output_item_count?: number;
	wiki_page?: string;
	ingredients: CacheIngredient[];
};

type RecipeCache = {
	recipesByOutputId: Record<string, CacheRecipe>;
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
const CACHE_URLS = [
	`${base}/legendary_recipes_cache.json`,
];

const recipeSourceRank: Record<CacheRecipe['source'], number> = {
	api: 3,
	wiki: 2,
	terminal: 1,
};

const isFinitePositiveInt = (value: unknown): value is number => {
	const n = Number(value);
	return Number.isFinite(n) && Number.isInteger(n) && n > 0;
};

const isFinitePositiveNumber = (value: unknown): value is number => {
	const n = Number(value);
	return Number.isFinite(n) && n > 0;
};

const normalizeCacheRecipe = (entry: unknown): CacheRecipe | null => {
	if (!entry || typeof entry !== 'object') return null;
	const raw = entry as Partial<CacheRecipe>;
	if (!isFinitePositiveInt(raw.output_item_id)) return null;
	if (raw.source !== 'api' && raw.source !== 'wiki' && raw.source !== 'terminal') return null;

	const ingredients = Array.isArray(raw.ingredients)
		? raw.ingredients
				.map((ingredient) => {
					if (!ingredient || typeof ingredient !== 'object') return null;
					const item_id = Number((ingredient as CacheIngredient).item_id);
					const count = Number((ingredient as CacheIngredient).count);
					if (!Number.isFinite(item_id) || item_id <= 0) return null;
					if (!Number.isFinite(count) || count <= 0) return null;
					return { item_id, count, name: (ingredient as CacheIngredient).name ?? null };
				})
				.filter((ingredient): ingredient is { item_id: number; count: number; name: string | null } => ingredient !== null)
		: [];

	const normalizedIngredients = (() => {
		if (raw.source !== 'wiki' || !ingredients.length) return ingredients;

		const blocks: typeof ingredients[] = [];
		let block: typeof ingredients = [];
		let blockStartId: number | null = null;

		for (const ingredient of ingredients) {
			if (!block.length) {
				block = [ingredient];
				blockStartId = ingredient.item_id;
				continue;
			}

			const looksLikeAltRestart = blockStartId != null && block.length > 1 && ingredient.item_id === blockStartId;
			if (looksLikeAltRestart) {
				blocks.push(block);
				block = [ingredient];
				blockStartId = ingredient.item_id;
				continue;
			}

			block.push(ingredient);
		}

		if (block.length) blocks.push(block);
		if (blocks.length <= 1) return ingredients;

		const score = (recipeBlock: typeof ingredients) =>
			recipeBlock.reduce((sum, ingredient) => sum + Math.max(0, Number(ingredient.count || 0)), 0);

		const best = [...blocks].sort((a, b) => {
			const scoreDiff = score(b) - score(a);
			if (scoreDiff !== 0) return scoreDiff;
			if (a.length !== b.length) return a.length - b.length;
			return 0;
		})[0];

		// Some wiki pages include multiple alternative recipes in one section.
		// Keep the strongest single block instead of concatenating all alternatives.
		return best;
	})();

	return {
		source: raw.source,
		output_item_id: raw.output_item_id,
		recipe_id: raw.recipe_id ?? null,
		output_item_count: isFinitePositiveNumber(raw.output_item_count) ? Number(raw.output_item_count) : 1,
		wiki_page: raw.wiki_page,
		ingredients: normalizedIngredients,
	};
};

const pickBetterRecipe = (current: CacheRecipe | undefined, next: CacheRecipe): CacheRecipe => {
	if (!current) return next;

	const currentRank = recipeSourceRank[current.source] || 0;
	const nextRank = recipeSourceRank[next.source] || 0;
	if (nextRank !== currentRank) return nextRank > currentRank ? next : current;

	const currentIngredientCount = current.ingredients.length;
	const nextIngredientCount = next.ingredients.length;
	if (nextIngredientCount !== currentIngredientCount) {
		return nextIngredientCount < currentIngredientCount ? next : current;
	}

	const currentOutputCount = Number(current.output_item_count || 1);
	const nextOutputCount = Number(next.output_item_count || 1);
	if (nextOutputCount !== currentOutputCount) return nextOutputCount > currentOutputCount ? next : current;

	return current;
};

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
	out.add(node.id);
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
		return { details: null };
	}

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

	const loadRecipeCache = async (): Promise<RecipeCache | null> => {
		const merged = new Map<number, CacheRecipe>();

		for (const url of CACHE_URLS) {
			const response = await fetch(url).catch(() => null);
			if (!response?.ok) continue;

			const json = (await response.json()) as Partial<RecipeCache>;
			if (!json?.recipesByOutputId || typeof json.recipesByOutputId !== 'object') continue;

			for (const [key, value] of Object.entries(json.recipesByOutputId)) {
				const outputId = Number(key);
				if (!Number.isFinite(outputId) || outputId <= 0) continue;
				const normalized = normalizeCacheRecipe(value);
				if (!normalized) continue;
				merged.set(outputId, pickBetterRecipe(merged.get(outputId), normalized));
			}
		}

		if (!merged.size) return null;

		const recipesByOutputId: Record<string, CacheRecipe> = {};
		for (const [outputId, recipe] of merged.entries()) {
			recipesByOutputId[String(outputId)] = recipe;
		}

		return { recipesByOutputId };
	};

	const recipeCache = await loadRecipeCache();
	const recipesByOutputId = recipeCache?.recipesByOutputId || {};

	const recipeForItem = (itemId: number): CacheRecipe | undefined => {
		const cached = recipesByOutputId[String(itemId)];
		if (cached && !(cached.source === 'terminal' && (!Array.isArray(cached.ingredients) || cached.ingredients.length === 0))) {
			return cached;
		}
		return cached;
	};

	const buildTreeFromCache = (
		itemId: number,
		neededCount: number,
		stack: Set<number>,
		ownedPool: Map<number, number>
	): RecipeTreeNode => {
		if (stack.has(itemId)) {
			return { id: itemId, count: neededCount, cycle: true, children: [] };
		}

		const available = ownedPool.get(itemId) || 0;
		const consumed = Math.min(available, neededCount);
		if (consumed > 0) {
			ownedPool.set(itemId, available - consumed);
		}
		const remainingToCraft = Math.max(0, neededCount - consumed);

		const recipe = recipeForItem(itemId);
		if (
			remainingToCraft <= 0 ||
			!recipe ||
			!Array.isArray(recipe.ingredients) ||
			recipe.ingredients.length === 0 ||
			recipe.source === 'terminal'
		) {
			return { id: itemId, count: neededCount, source: recipe?.source, children: [] };
		}

		const outputCount = Math.max(0.000001, Number(recipe.output_item_count || 1));
		const craftsNeeded = Math.ceil(remainingToCraft / outputCount);
		const nextStack = new Set(stack);
		nextStack.add(itemId);

		const children: RecipeTreeNode[] = [];
		for (const ingredient of recipe.ingredients) {
			const ingId = Number(ingredient.item_id);
			const ingCount = Number(ingredient.count || 0);
			if (!Number.isFinite(ingId) || ingId <= 0 || !Number.isFinite(ingCount) || ingCount <= 0) continue;
			if (ingId === itemId) continue;
			children.push(buildTreeFromCache(ingId, craftsNeeded * ingCount, nextStack, ownedPool));
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

	const recipeTree = buildTreeFromCache(targetItemId, 1, new Set<number>(), new Map(ownedByItem));
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

			const available = ownedPool.get(itemId) || 0;
			const consumed = Math.min(available, neededCount);
			if (consumed > 0) {
				ownedPool.set(itemId, available - consumed);
			}
			const remaining = neededCount - consumed;
			if (remaining <= 0) return;

			const recipe = recipeForItem(itemId);
			const validIngredients = (recipe?.ingredients || []).filter((ingredient) => {
				const ingId = Number(ingredient.item_id);
				const ingCount = Number(ingredient.count || 0);
				return Number.isFinite(ingId) && ingId > 0 && Number.isFinite(ingCount) && ingCount > 0 && ingId !== itemId;
			});
			const hasRecipe = Boolean(recipe && recipe.source !== 'terminal' && validIngredients.length);
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
		if (!recipe || recipe.source === 'terminal' || !Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) return null;

		const currentItem = itemsById[itemId];
		if (isTradingPostEligible(currentItem) && recipe.source === 'wiki') {
			// Do not model Mystic Forge conversions for tradeable materials.
			// For market items we prefer direct TP valuation over probabilistic/inefficient transmutation chains.
			return null;
		}

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
		craftUnit: number | null
	): { unit: number | null; source: 'tp' | 'craft' | 'none' } => {
		if (tpUnit != null && craftUnit != null) {
			return tpUnit <= craftUnit ? { unit: tpUnit, source: 'tp' } : { unit: craftUnit, source: 'craft' };
		}
		if (tpUnit != null) return { unit: tpUnit, source: 'tp' };
		if (craftUnit != null) return { unit: craftUnit, source: 'craft' };
		return { unit: null, source: 'none' };
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
			const craftBuyUnit = estimateCraftUnitCost(id, 'buy');
			const craftSellUnit = estimateCraftUnitCost(id, 'sell');
			const bestBuy = pickBestUnit(tpEligible ? buyUnit : null, craftBuyUnit);
			const bestSell = pickBestUnit(tpEligible ? sellUnit : null, craftSellUnit);

			return {
				id,
				required: needed,
				owned,
				missing,
				buyUnit,
				sellUnit,
				craftBuyUnit,
				craftSellUnit,
				bestBuyUnit: bestBuy.unit,
				bestSellUnit: bestSell.unit,
				bestBuySource: bestBuy.source,
				bestSellSource: bestSell.source,
				tpEligible,
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

	return { details };
};
