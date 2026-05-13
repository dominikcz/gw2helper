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
	tpEligible: boolean;
	tpReason: 'ok' | 'bound' | 'no-listing';
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
	`${base}/legendary_recipes_cache.kudzu.v3.json`,
	`${base}/legendary_recipes_cache.kudzu.json`,
];

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
		for (const url of CACHE_URLS) {
			const response = await fetch(url).catch(() => null);
			if (!response?.ok) continue;
			const json = (await response.json()) as RecipeCache;
			if (json && json.recipesByOutputId && typeof json.recipesByOutputId === 'object') {
				return json;
			}
		}
		return null;
	};

	const recipeCache = await loadRecipeCache();
	const recipesByOutputId = recipeCache?.recipesByOutputId || {};

	const buildTreeFromCache = (itemId: number, neededCount: number, stack: Set<number>): RecipeTreeNode => {
		if (stack.has(itemId)) {
			return { id: itemId, count: neededCount, cycle: true, children: [] };
		}

		const recipe = recipesByOutputId[String(itemId)];
		if (!recipe || !Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0 || recipe.source === 'terminal') {
			return { id: itemId, count: neededCount, source: recipe?.source, children: [] };
		}

		const outputCount = Math.max(1, Number(recipe.output_item_count || 1));
		const craftsNeeded = Math.ceil(neededCount / outputCount);
		const nextStack = new Set(stack);
		nextStack.add(itemId);

		const children: RecipeTreeNode[] = [];
		for (const ingredient of recipe.ingredients) {
			const ingId = Number(ingredient.item_id);
			const ingCount = Number(ingredient.count || 0);
			if (!Number.isFinite(ingId) || ingId <= 0 || !Number.isFinite(ingCount) || ingCount <= 0) continue;
			if (ingId === itemId) continue;
			children.push(buildTreeFromCache(ingId, craftsNeeded * ingCount, nextStack));
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
	const recipeTree = buildTreeFromCache(targetItemId, 1, new Set<number>());
	const recipeAvailable = recipeTree.children.length > 0;

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

			const recipe = recipesByOutputId[String(itemId)];
			const validIngredients = (recipe?.ingredients || []).filter((ingredient) => {
				const ingId = Number(ingredient.item_id);
				const ingCount = Number(ingredient.count || 0);
				return Number.isFinite(ingId) && ingId > 0 && Number.isFinite(ingCount) && ingCount > 0 && ingId !== itemId;
			});
			const hasRecipe = Boolean(recipe && recipe.source !== 'terminal' && validIngredients.length);
			const item = itemsById[itemId];
			const isMysticForgeComposite = Boolean(item?.name && /^gift of\s+/i.test(item.name));

			if (!isRootNode && (!hasRecipe || (isTradingPostEligible(item) && !isMysticForgeComposite))) {
				requiredByItem.set(itemId, (requiredByItem.get(itemId) || 0) + remaining);
				return;
			}

			if (!hasRecipe) {
				requiredByItem.set(itemId, (requiredByItem.get(itemId) || 0) + remaining);
				return;
			}

			const outputCount = Math.max(1, Number(recipe.output_item_count || 1));
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

	const priceIds = [...requiredByItem.keys()];
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

	const ingredients: IngredientRow[] = [...requiredByItem.entries()]
		.map(([id, required]) => {
			const owned = ownedByItem.get(id) || 0;
			const missing = Math.max(0, required - owned);
			const item = itemsById[id];
			const price = priceById.get(id);
			const tpEligible = isTradingPostEligible(item);
			const buyUnit = price?.buys?.unit_price ?? null;
			const sellUnit = price?.sells?.unit_price ?? null;
			const tpReason: IngredientRow['tpReason'] = !tpEligible ? 'bound' : (buyUnit == null && sellUnit == null ? 'no-listing' : 'ok');
			return { id, required, owned, missing, buyUnit, sellUnit, tpEligible, tpReason };
		})
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
