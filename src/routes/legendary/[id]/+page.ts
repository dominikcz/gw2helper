export const ssr = false;

import { asset } from '$app/paths';
import type { PageLoad } from './$types';
import type { CharacterWithItems, ExpandedItem } from '$lib/types/gw2-api';
import {
	normalizeRecipeEntry,
	appendItems,
	toObjById,
	mapToObj,
	inBatches,
	isTradingPostEligible,
	buildLegendaryTree,
	accumulateRequiredItems,
	collectPriceIds,
	computeIngredientRows,
	type CacheRecipe,
	type ItemSummary,
	type IngredientRow,
	type PriceEntry,
} from '$lib/legendary/calculator';

type LegendaryDetailsData = {
	targetItemId: number;
	targetItem: ItemSummary | null;
	recipeTree: ReturnType<typeof buildLegendaryTree>['recipeTree'] | null;
	recipeAvailable: boolean;
	ingredients: IngredientRow[];
	itemsById: Record<number, ItemSummary>;
	ownedById: Record<number, number>;
};

type LegendaryRecipePack = {
	version?: number;
	recipesByItemId?: Record<string, unknown>;
};

function pickBestRecipeEntry(entries: unknown): unknown | null {
	if (!Array.isArray(entries) || entries.length === 0) return null;
	const custom = entries.find(
		(e) => typeof e === 'object' && e !== null && Number((e as Record<string, unknown>).id) === 0
	);
	if (custom) return custom;
	return (
		entries.find(
			(e) => typeof e === 'object' && e !== null && Number((e as Record<string, unknown>).id) > 0
		) ?? null
	);
}

async function loadLegendaryRecipePack(
	fetchFn: (input: string) => Promise<Response>
): Promise<Map<number, CacheRecipe>> {
	const packUrl = asset('/data/recipies/legendary-pack.json');
	const res = await fetchFn(packUrl).catch(() => null);
	if (!res?.ok) return new Map<number, CacheRecipe>();

	const rawPack: unknown = await res.json().catch(() => null);
	if (!rawPack || typeof rawPack !== 'object') return new Map<number, CacheRecipe>();

	const pack = rawPack as LegendaryRecipePack;
	const byId = pack.recipesByItemId;
	if (!byId || typeof byId !== 'object') return new Map<number, CacheRecipe>();

	const map = new Map<number, CacheRecipe>();
	for (const [id, entry] of Object.entries(byId)) {
		const itemId = Number(id);
		if (!Number.isInteger(itemId) || itemId <= 0 || !entry) continue;

		const picked = pickBestRecipeEntry(entry);
		const source = picked ?? entry;
		const normalized = normalizeRecipeEntry(source);
		if (normalized) map.set(itemId, normalized);
	}

	return map;
}

async function prefetchRecipeTree(
	packRecipesById: Map<number, CacheRecipe>,
	rootId: number,
	maxDepth = 8
): Promise<Map<number, CacheRecipe>> {
	const cache = new Map<number, CacheRecipe>();
	const visited = new Set<number>([rootId]);
	let frontier = [rootId];

	for (let depth = 0; depth <= maxDepth && frontier.length > 0; depth++) {
		const results = await Promise.all(
			frontier.map(async (id): Promise<[number, CacheRecipe | null]> => {
				return [id, packRecipesById.get(id) ?? null];
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
		for (const [k, v] of Object.entries(query)) search.set(k, String(v));
		const url = `https://api.guildwars2.com${path}?${search.toString()}`;
		const response = await fetch(url);
		if (!response.ok) throw new Error(`Failed ${path}: ${response.status}`);
		return (await response.json()) as T;
	};

	const packRecipesById = await loadLegendaryRecipePack(fetch);
	const recipeCache = await prefetchRecipeTree(packRecipesById, targetItemId);

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
	for (const character of characterItems) appendItems(ownedByItem, character._items || []);

	const { recipeTree, treeIds } = buildLegendaryTree(targetItemId, recipeCache, ownedByItem);
	const recipeAvailable = recipeTree.children.length > 0;

	const allItemIds = [...treeIds].filter((id) => Number.isFinite(id) && id > 0);
	const itemList = (
		await Promise.all(
			inBatches(allItemIds).map((batch) =>
				apiService.items(batch.join(',')).catch(() => [] as ItemSummary[])
			)
		)
	).flat();
	const itemsById = toObjById(itemList);

	const requiredByItem = recipeAvailable
		? accumulateRequiredItems(targetItemId, recipeCache, itemsById, ownedByItem)
		: new Map<number, number>();

	const priceIds = [...collectPriceIds(recipeCache, requiredByItem, itemsById)];
	const prices = (
		await Promise.all(
			inBatches(priceIds).map((batch) =>
				fetchGw2<Array<{ id: number } & PriceEntry>>('/v2/commerce/prices', {
					ids: batch.join(','),
				}).catch(() => [])
			)
		)
	).flat();
	const priceById = new Map<number, PriceEntry>();
	for (const price of prices) priceById.set(price.id, price);

	const ingredients = computeIngredientRows(requiredByItem, {
		recipeCache,
		itemsById,
		priceById,
		ownedByItem,
	});

	return {
		targetItemId,
		targetItem,
		recipeTree,
		recipeAvailable,
		ingredients,
		itemsById,
		ownedById: mapToObj(ownedByItem),
	};
	})();

	return { targetItemId, details: detailsPromise };
};
