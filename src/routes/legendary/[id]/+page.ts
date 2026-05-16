export const ssr = false;

import { base } from '$app/paths';
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

function recipeFileUrl(itemId: number): string {
	return `${base}/recipies/${String(itemId).split('').join('/')}/${itemId}.json`;
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

	const recipeCache = await prefetchRecipeTree(fetch, targetItemId);

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
