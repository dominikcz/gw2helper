#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const LEGENDARIES_PATH = path.join(ROOT, 'legendaries_all.json');
const RECIPES_PATH = path.join(ROOT, 'recipies_all.json');
const OUT_PATH = path.join(ROOT, 'static', 'legendary_recipes_cache.json');
const LEGACY_CACHE_PATHS = [
	OUT_PATH,
];

function readJson(filePath) {
	return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readJsonOrNull(filePath) {
	try {
		if (!fs.existsSync(filePath)) return null;
		return JSON.parse(fs.readFileSync(filePath, 'utf8'));
	} catch {
		return null;
	}
}

function stableSortNumbers(values) {
	return [...values].sort((a, b) => a - b);
}

function sanitizeRecipe(recipe) {
	const ingredients = Array.isArray(recipe.ingredients)
		? recipe.ingredients
				.map((ingredient) => {
					const itemId = Number(ingredient?.item_id);
					const count = Number(ingredient?.count);
					if (!Number.isFinite(itemId) || itemId <= 0) return null;
					if (!Number.isFinite(count) || count <= 0) return null;
					return { item_id: itemId, count, name: null };
				})
				.filter(Boolean)
		: [];

	return {
		source: 'api',
		output_item_id: Number(recipe.output_item_id),
		recipe_id: Number(recipe.id),
		output_item_count: Number(recipe.output_item_count) > 0 ? Number(recipe.output_item_count) : 1,
		ingredients,
		all_recipe_ids: [Number(recipe.id)],
		fetched_at: new Date().toISOString(),
	};
}

function normalizeCachedRecipe(entry, outputId) {
	if (!entry || typeof entry !== 'object') return null;
	const source = entry.source === 'api' || entry.source === 'wiki' || entry.source === 'terminal' ? entry.source : 'terminal';
	const normalized = {
		source,
		output_item_id: Number(outputId),
		recipe_id: Number.isFinite(Number(entry.recipe_id)) ? Number(entry.recipe_id) : null,
		output_item_count: Number(entry.output_item_count) > 0 ? Number(entry.output_item_count) : 1,
		ingredients: Array.isArray(entry.ingredients)
			? entry.ingredients
					.map((ingredient) => {
						const itemId = Number(ingredient?.item_id);
						const count = Number(ingredient?.count);
						if (!Number.isFinite(itemId) || itemId <= 0) return null;
						if (!Number.isFinite(count) || count <= 0) return null;
						return { item_id: itemId, count, name: ingredient?.name ?? null };
					})
					.filter(Boolean)
			: [],
		all_recipe_ids: Array.isArray(entry.all_recipe_ids)
			? stableSortNumbers(entry.all_recipe_ids.map((id) => Number(id)).filter((id) => Number.isFinite(id) && id > 0))
			: [],
		fetched_at: typeof entry.fetched_at === 'string' ? entry.fetched_at : null,
	};

	return normalized;
}

const SOURCE_SCORE = {
	api: 3,
	wiki: 2,
	terminal: 1,
};

function pickBetterRecipe(current, next) {
	if (!current) return next;
	const currentScore = SOURCE_SCORE[current.source] || 0;
	const nextScore = SOURCE_SCORE[next.source] || 0;

	if (nextScore !== currentScore) {
		return nextScore > currentScore ? next : current;
	}

	if (next.ingredients.length !== current.ingredients.length) {
		return next.ingredients.length < current.ingredients.length ? next : current;
	}

	if ((next.output_item_count || 1) !== (current.output_item_count || 1)) {
		return (next.output_item_count || 1) > (current.output_item_count || 1) ? next : current;
	}

	return current;
}

function pickPrimaryRecipe(recipes) {
	if (!recipes.length) return null;
	const sorted = [...recipes].sort((a, b) => {
		const aOut = Number(a.output_item_count) || 1;
		const bOut = Number(b.output_item_count) || 1;
		if (aOut !== bOut) return bOut - aOut;
		const aIng = Array.isArray(a.ingredients) ? a.ingredients.length : Number.MAX_SAFE_INTEGER;
		const bIng = Array.isArray(b.ingredients) ? b.ingredients.length : Number.MAX_SAFE_INTEGER;
		if (aIng !== bIng) return aIng - bIng;
		return Number(a.id) - Number(b.id);
	});
	const primary = sanitizeRecipe(sorted[0]);
	primary.all_recipe_ids = stableSortNumbers(sorted.map((r) => Number(r.id)).filter((id) => Number.isFinite(id) && id > 0));
	return primary;
}

function main() {
	const legendaries = readJson(LEGENDARIES_PATH);
	const recipes = readJson(RECIPES_PATH);

	const legendaryIds = stableSortNumbers(
		legendaries.map((item) => Number(item?.id)).filter((id) => Number.isFinite(id) && id > 0)
	);

	const recipesByOutput = new Map();
	for (const recipe of recipes) {
		const outputId = Number(recipe?.output_item_id);
		if (!Number.isFinite(outputId) || outputId <= 0) continue;
		if (!recipesByOutput.has(outputId)) recipesByOutput.set(outputId, []);
		recipesByOutput.get(outputId).push(recipe);
	}

	const queue = [...legendaryIds];
	const visited = new Set();
	const generatedByOutputId = {};

	while (queue.length) {
		const outputId = queue.shift();
		if (visited.has(outputId)) continue;
		visited.add(outputId);

		const outputRecipes = recipesByOutput.get(outputId) || [];
		if (!outputRecipes.length) continue;

		const primary = pickPrimaryRecipe(outputRecipes);
		if (!primary || !primary.ingredients.length) continue;

		generatedByOutputId[String(outputId)] = primary;
		for (const ingredient of primary.ingredients) {
			if (!visited.has(ingredient.item_id)) {
				queue.push(ingredient.item_id);
			}
		}
	}

	const mergedByOutputId = {};

	for (const cachePath of LEGACY_CACHE_PATHS) {
		const legacy = readJsonOrNull(cachePath);
		if (!legacy || !legacy.recipesByOutputId || typeof legacy.recipesByOutputId !== 'object') continue;
		for (const [outputIdStr, entry] of Object.entries(legacy.recipesByOutputId)) {
			const outputId = Number(outputIdStr);
			if (!Number.isFinite(outputId) || outputId <= 0) continue;
			const normalized = normalizeCachedRecipe(entry, outputId);
			if (!normalized) continue;
			mergedByOutputId[String(outputId)] = pickBetterRecipe(mergedByOutputId[String(outputId)], normalized);
		}
	}

	for (const [outputIdStr, entry] of Object.entries(generatedByOutputId)) {
		const outputId = Number(outputIdStr);
		const normalized = normalizeCachedRecipe(entry, outputId);
		if (!normalized) continue;
		const current = mergedByOutputId[String(outputId)];
		const better = pickBetterRecipe(current, normalized);
		const ids = new Set([...(current?.all_recipe_ids || []), ...(normalized.all_recipe_ids || [])]);
		better.all_recipe_ids = stableSortNumbers([...ids]);
		mergedByOutputId[String(outputId)] = better;
	}

	const hasDirectRecipe = (id) => {
		const recipe = mergedByOutputId[String(id)];
		if (!recipe) return false;
		if (recipe.source === 'terminal') return false;
		return Array.isArray(recipe.ingredients) && recipe.ingredients.length > 0;
	};

	const rootsWithRecipe = legendaryIds.filter((id) => hasDirectRecipe(id));
	const rootsMissingRecipe = legendaryIds.filter((id) => !hasDirectRecipe(id));

	const cache = {
		version: 2,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		generator: 'scripts/build-legendary-recipe-cache.cjs',
		mergedFrom: LEGACY_CACHE_PATHS.map((cachePath) => path.relative(ROOT, cachePath)),
		roots: legendaryIds,
		stats: {
			rootCount: legendaryIds.length,
			rootsWithRecipe: rootsWithRecipe.length,
			rootsMissingRecipe: rootsMissingRecipe.length,
			recipeNodeCount: Object.keys(mergedByOutputId).length,
			generatedApiNodeCount: Object.keys(generatedByOutputId).length,
		},
		rootsMissingRecipe,
		recipesByOutputId: mergedByOutputId,
	};

	fs.writeFileSync(OUT_PATH, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');

	console.log('Legendary recipe cache generated.');
	console.log(`- roots: ${cache.stats.rootCount}`);
	console.log(`- roots with recipe: ${cache.stats.rootsWithRecipe}`);
	console.log(`- roots missing recipe: ${cache.stats.rootsMissingRecipe}`);
	console.log(`- cached recipe nodes: ${cache.stats.recipeNodeCount}`);
}

main();
