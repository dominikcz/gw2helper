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
	`${base}/legendary_recipes_cache.kudzu.v3.json`,
	`${base}/legendary_recipes_cache.kudzu.json`,
];

// Fallbacks for known Mystic Forge gifts when cache is missing wiki recipe parsing.
const STATIC_RECIPE_FALLBACKS: Record<number, CacheRecipe> = {
	19672: {
		source: 'wiki',
		output_item_id: 19672,
		recipe_id: null,
		output_item_count: 1,
		wiki_page: 'Gift of Might',
		ingredients: [
			{ item_id: 24357, count: 250, name: 'Vicious Fang' },
			{ item_id: 24289, count: 250, name: 'Armored Scale' },
			{ item_id: 24351, count: 250, name: 'Vicious Claw' },
			{ item_id: 24358, count: 250, name: 'Ancient Bone' },
		],
	},
	19673: {
		source: 'wiki',
		output_item_id: 19673,
		recipe_id: null,
		output_item_count: 1,
		wiki_page: 'Gift of Magic',
		ingredients: [
			{ item_id: 24295, count: 250, name: 'Vial of Powerful Blood' },
			{ item_id: 24283, count: 250, name: 'Powerful Venom Sac' },
			{ item_id: 24300, count: 250, name: 'Elaborate Totem' },
			{ item_id: 24277, count: 250, name: 'Pile of Crystalline Dust' },
		],
	},
	19674: {
		source: 'wiki',
		output_item_id: 19674,
		recipe_id: null,
		output_item_count: 1,
		wiki_page: 'Gift of Mastery',
		ingredients: [
			{ item_id: 20797, count: 1, name: 'Bloodstone Shard' },
			{ item_id: 19925, count: 250, name: 'Obsidian Shard' },
			{ item_id: 19677, count: 1, name: 'Gift of Exploration' },
			{ item_id: 19678, count: 1, name: 'Gift of Battle' },
		],
	},
	19626: {
		source: 'wiki',
		output_item_id: 19626,
		recipe_id: null,
		output_item_count: 1,
		wiki_page: 'Gift of Fortune',
		ingredients: [
			{ item_id: 19672, count: 1, name: 'Gift of Might' },
			{ item_id: 19673, count: 1, name: 'Gift of Magic' },
			{ item_id: 19675, count: 77, name: 'Mystic Clover' },
			{ item_id: 19721, count: 250, name: 'Glob of Ectoplasm' },
		],
	},
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

	const recipeForItem = (itemId: number): CacheRecipe | undefined => {
		const cached = recipesByOutputId[String(itemId)];
		if (cached && !(cached.source === 'terminal' && (!Array.isArray(cached.ingredients) || cached.ingredients.length === 0))) {
			return cached;
		}
		return STATIC_RECIPE_FALLBACKS[itemId] || cached;
	};

	const buildTreeFromCache = (itemId: number, neededCount: number, stack: Set<number>): RecipeTreeNode => {
		if (stack.has(itemId)) {
			return { id: itemId, count: neededCount, cycle: true, children: [] };
		}

		const recipe = recipeForItem(itemId);
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

			const recipe = recipeForItem(itemId);
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

			if (!recipe) {
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
			const tpReason: IngredientRow['tpReason'] = !tpEligible ? 'bound' : (buyUnit == null && sellUnit == null ? 'no-listing' : 'ok');
			return { id, required: needed, owned, missing, buyUnit, sellUnit, tpEligible, tpReason };
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
