#!/usr/bin/env node
/* eslint-disable no-console */
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const CACHE_PATH = path.join(ROOT, 'static', 'legendary_recipes_cache.json');
const LEGENDARIES_PATH = path.join(ROOT, 'legendaries_all.json');
const OUT_DIR = path.join(ROOT, 'reports');
const OUT_PER_ITEM = path.join(OUT_DIR, 'legendary_expansion_blockers.csv');
const OUT_SHARED = path.join(OUT_DIR, 'legendary_shared_blockers.csv');

function readJson(filePath, fallback = null) {
	try {
		return JSON.parse(fs.readFileSync(filePath, 'utf8'));
	} catch {
		return fallback;
	}
}

function isPositiveInt(value) {
	return Number.isInteger(value) && value > 0;
}

function normalizeReason(reason) {
	if (reason === 'no-recipe-record') return 'no_recipe_record';
	if (reason === 'terminal-source') return 'terminal_source';
	if (reason === 'empty-ingredients') return 'empty_ingredients';
	if (reason === 'invalid-ingredient-id') return 'invalid_ingredient_id';
	if (reason === 'self-referential-ingredient') return 'self_referential_ingredient';
	if (reason === 'cycle') return 'cycle';
	return String(reason || 'unknown');
}

function csvEscape(value) {
	const text = String(value ?? '');
	if (text.includes(',') || text.includes('"') || text.includes('\n') || text.includes('\r')) {
		return `"${text.replace(/"/g, '""')}"`;
	}
	return text;
}

function toCsv(rows) {
	return `${rows.map((row) => row.map(csvEscape).join(',')).join('\n')}\n`;
}

function main() {
	const cache = readJson(CACHE_PATH, null);
	if (!cache || typeof cache !== 'object') {
		console.error('Missing or invalid static/legendary_recipes_cache.json');
		process.exit(1);
	}

	const recipesByOutputId = cache.recipesByOutputId || {};
	const roots = Array.isArray(cache.roots) ? cache.roots.map(Number).filter((id) => isPositiveInt(id)) : [];
	if (!roots.length) {
		console.error('No roots in legendary cache');
		process.exit(1);
	}

	const legendaries = readJson(LEGENDARIES_PATH, []);
	const rootNameById = new Map();
	for (const item of legendaries) {
		const id = Number(item?.id);
		if (!isPositiveInt(id)) continue;
		if (typeof item?.name === 'string' && item.name.trim()) {
			rootNameById.set(id, item.name.trim());
		}
	}

	const nameById = new Map(rootNameById);
	for (const recipe of Object.values(recipesByOutputId)) {
		if (!recipe || typeof recipe !== 'object') continue;
		const outputId = Number(recipe.output_item_id);
		if (isPositiveInt(outputId) && typeof recipe.wiki_page === 'string' && recipe.wiki_page.trim()) {
			if (!nameById.has(outputId)) nameById.set(outputId, recipe.wiki_page.trim());
		}
		if (!Array.isArray(recipe.ingredients)) continue;
		for (const ingredient of recipe.ingredients) {
			const ingId = Number(ingredient?.item_id);
			if (!isPositiveInt(ingId)) continue;
			if (typeof ingredient?.name === 'string' && ingredient.name.trim() && !nameById.has(ingId)) {
				nameById.set(ingId, ingredient.name.trim());
			}
		}
	}

	const sharedBlockers = new Map();

	const perRootRows = [
		[
			'root_id',
			'root_name',
			'fully_expandable',
			'blocker_count',
			'blocker_ids',
			'blocker_reasons',
			'blockers_detail',
		],
	];

	for (const rootId of roots) {
		const blockers = new Map();

		const visit = (itemId, stack) => {
			if (!isPositiveInt(itemId)) {
				const key = `invalid:${itemId}:invalid-ingredient-id`;
				blockers.set(key, { itemId: null, reason: 'invalid-ingredient-id' });
				return;
			}

			if (stack.has(itemId)) {
				const key = `${itemId}:cycle`;
				blockers.set(key, { itemId, reason: 'cycle' });
				return;
			}

			const recipe = recipesByOutputId[String(itemId)];
			if (!recipe) {
				const key = `${itemId}:no-recipe-record`;
				blockers.set(key, { itemId, reason: 'no-recipe-record' });
				return;
			}

			const source = String(recipe.source || '');
			if (source === 'terminal') {
				const key = `${itemId}:terminal-source`;
				blockers.set(key, { itemId, reason: 'terminal-source' });
				return;
			}

			if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
				const key = `${itemId}:empty-ingredients`;
				blockers.set(key, { itemId, reason: 'empty-ingredients' });
				return;
			}

			const nextStack = new Set(stack);
			nextStack.add(itemId);
			for (const ingredient of recipe.ingredients) {
				const ingId = Number(ingredient?.item_id);
				if (!isPositiveInt(ingId)) {
					const key = `invalid:${ingredient?.item_id}:invalid-ingredient-id`;
					blockers.set(key, { itemId: null, reason: 'invalid-ingredient-id' });
					continue;
				}
				if (ingId === itemId) {
					const key = `${itemId}:self-referential-ingredient`;
					blockers.set(key, { itemId, reason: 'self-referential-ingredient' });
					continue;
				}
				visit(ingId, nextStack);
			}
		};

		visit(rootId, new Set());

		const blockerEntries = [...blockers.values()];
		const fullyExpandable = blockerEntries.length === 0;

		const blockerIds = blockerEntries
			.map((b) => (isPositiveInt(b.itemId) ? b.itemId : null))
			.filter((id) => id !== null)
			.sort((a, b) => a - b)
			.join('|');

		const blockerReasons = [...new Set(blockerEntries.map((b) => normalizeReason(b.reason)))].sort().join('|');

		const blockersDetail = blockerEntries
			.map((b) => {
				const id = isPositiveInt(b.itemId) ? b.itemId : 'n/a';
				const name = isPositiveInt(b.itemId) ? nameById.get(b.itemId) || '' : '';
				return `${id}:${normalizeReason(b.reason)}${name ? `:${name}` : ''}`;
			})
			.sort()
			.join(';');

		for (const b of blockerEntries) {
			if (!isPositiveInt(b.itemId)) continue;
			const key = `${b.itemId}:${normalizeReason(b.reason)}`;
			if (!sharedBlockers.has(key)) {
				sharedBlockers.set(key, {
					blockerId: b.itemId,
					blockerName: nameById.get(b.itemId) || '',
					reason: normalizeReason(b.reason),
					rootIds: new Set(),
					rootNames: new Set(),
				});
			}
			const rec = sharedBlockers.get(key);
			rec.rootIds.add(rootId);
			rec.rootNames.add(rootNameById.get(rootId) || String(rootId));
		}

		perRootRows.push([
			String(rootId),
			rootNameById.get(rootId) || '',
			fullyExpandable ? 'yes' : 'no',
			String(blockerEntries.length),
			blockerIds,
			blockerReasons,
			blockersDetail,
		]);
	}

	const sharedRows = [
		['blocker_id', 'blocker_name', 'reason', 'affected_roots_count', 'affected_root_ids', 'affected_root_names'],
	];

	const sortedShared = [...sharedBlockers.values()].sort((a, b) => {
		const countDiff = b.rootIds.size - a.rootIds.size;
		if (countDiff !== 0) return countDiff;
		return a.blockerId - b.blockerId;
	});

	for (const rec of sortedShared) {
		const rootIds = [...rec.rootIds].sort((a, b) => a - b);
		const rootNames = [...rec.rootNames].sort();
		sharedRows.push([
			String(rec.blockerId),
			rec.blockerName,
			rec.reason,
			String(rec.rootIds.size),
			rootIds.join('|'),
			rootNames.join('|'),
		]);
	}

	fs.mkdirSync(OUT_DIR, { recursive: true });
	fs.writeFileSync(OUT_PER_ITEM, toCsv(perRootRows), 'utf8');
	fs.writeFileSync(OUT_SHARED, toCsv(sharedRows), 'utf8');

	const blockedRoots = perRootRows.slice(1).filter((r) => r[2] === 'no').length;
	console.log(`Report generated: ${path.relative(ROOT, OUT_PER_ITEM)}`);
	console.log(`Shared blockers: ${path.relative(ROOT, OUT_SHARED)}`);
	console.log(`Roots blocked: ${blockedRoots}/${roots.length}`);
	console.log(`Unique shared blockers: ${sortedShared.length}`);
}

main();
