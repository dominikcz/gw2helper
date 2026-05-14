#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const CACHE_PATH = path.join(ROOT, 'static', 'legendary_recipes_cache.json');

function fail(message) {
	console.error(`Legendary cache check failed: ${message}`);
	process.exit(1);
}

function isPositiveInt(value) {
	return Number.isInteger(value) && value > 0;
}

function main() {
	if (!fs.existsSync(CACHE_PATH)) fail('static/legendary_recipes_cache.json does not exist');

	let cache;
	try {
		cache = JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
	} catch (error) {
		fail(`invalid JSON (${error.message})`);
	}

	if (!cache || typeof cache !== 'object') fail('cache must be an object');
	if (!cache.recipesByOutputId || typeof cache.recipesByOutputId !== 'object') fail('recipesByOutputId must be an object');

	const entries = Object.entries(cache.recipesByOutputId);
	for (const [key, recipe] of entries) {
		const outputId = Number(key);
		if (!isPositiveInt(outputId)) fail(`invalid output id key: ${key}`);
		if (!recipe || typeof recipe !== 'object') fail(`recipe for ${key} is not an object`);
		if (!isPositiveInt(Number(recipe.output_item_id))) fail(`recipe ${key} has invalid output_item_id`);
		if (Number(recipe.output_item_id) !== outputId) fail(`recipe ${key} output_item_id mismatch`);
		if (!isPositiveInt(Number(recipe.output_item_count || 1))) fail(`recipe ${key} has invalid output_item_count`);
		if (!Array.isArray(recipe.ingredients)) fail(`recipe ${key} ingredients must be an array`);

		for (const ingredient of recipe.ingredients) {
			const itemId = ingredient?.item_id;
			if (itemId !== null && itemId !== undefined && !isPositiveInt(Number(itemId))) {
				fail(`recipe ${key} has invalid ingredient item_id`);
			}
			if (!isPositiveInt(Number(ingredient?.count))) fail(`recipe ${key} has invalid ingredient count`);
		}
	}

	if (Array.isArray(cache.roots)) {
		for (const rootId of cache.roots) {
			if (!isPositiveInt(Number(rootId))) fail(`invalid root id: ${rootId}`);
		}
	}

	console.log('Legendary cache OK');
	console.log(`- recipe nodes: ${entries.length}`);
	if (Array.isArray(cache.roots)) {
		const rootCount = cache.roots.length;
		const covered = cache.roots.filter((id) => Object.prototype.hasOwnProperty.call(cache.recipesByOutputId, String(id))).length;
		console.log(`- roots with direct recipe: ${covered}/${rootCount}`);
	}
}

main();
