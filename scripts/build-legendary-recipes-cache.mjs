import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REQUEST_DELAY_MS = Number(process.env.GW2W_REQUEST_DELAY_MS || 500);
const MAX_ITEMS = Number(process.env.GW2W_CACHE_MAX_ITEMS || 0);
const SEED_IDS = String(process.env.GW2W_CACHE_SEED_IDS || '')
	.split(',')
	.map((x) => Number(x.trim()))
	.filter((x) => Number.isFinite(x) && x > 0);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');

const LEGENDARIES_FILE = path.join(ROOT_DIR, 'legendaries_all.json');
const RECIPES_FILE = path.join(ROOT_DIR, 'recipies_all.json');
const STATIC_CACHE_FILE = path.join(ROOT_DIR, 'static', 'legendary_recipes_cache.json');
const CACHE_FILE = process.env.GW2W_CACHE_FILE
	? path.isAbsolute(process.env.GW2W_CACHE_FILE)
		? process.env.GW2W_CACHE_FILE
		: path.resolve(ROOT_DIR, process.env.GW2W_CACHE_FILE)
	: STATIC_CACHE_FILE;

let lastRequestTime = 0;

async function sleep(ms) {
	if (ms <= 0) return;
	await new Promise((resolve) => setTimeout(resolve, ms));
}

async function throttledFetchJson(url) {
	const now = Date.now();
	const elapsed = now - lastRequestTime;
	if (elapsed < REQUEST_DELAY_MS) {
		await sleep(REQUEST_DELAY_MS - elapsed);
	}
	const response = await fetch(url, {
		headers: {
			'User-Agent': 'gw2helper-cache-bot/1.0 (+local script)',
			Accept: 'application/json',
		},
	});
	lastRequestTime = Date.now();
	if (!response.ok) {
		throw new Error(`HTTP ${response.status} for ${url}`);
	}
	return response.json();
}

async function readJson(filePath, fallback) {
	try {
		const raw = await fs.readFile(filePath, 'utf8');
		return JSON.parse(raw);
	} catch {
		return fallback;
	}
}

function buildApiRecipesByOutput(recipes) {
	const map = new Map();
	for (const recipe of recipes) {
		const output = Number(recipe.output_item_id);
		if (!Number.isFinite(output) || output <= 0) continue;
		const existing = map.get(output) || [];
		existing.push(recipe);
		map.set(output, existing);
	}
	return map;
}

function selectPrimaryApiRecipe(recipes) {
	return [...recipes].sort((a, b) => {
		const lenA = Array.isArray(a.ingredients) ? a.ingredients.length : 999;
		const lenB = Array.isArray(b.ingredients) ? b.ingredients.length : 999;
		if (lenA !== lenB) return lenA - lenB;
		return Number(a.id) - Number(b.id);
	})[0];
}

function parseWikiRecipeSectionWikitext(sectionText) {
	const out = [];
	let outputCount = 1;
	let sawIngredient = false;
	for (const rawLine of sectionText.split('\n')) {
		const line = rawLine.trim();
		const outputMatch = line.match(/^\|\s*(?:output\s*quantity|output\s*qty|output_count)\s*=\s*(\d+)/i);
		if (outputMatch) {
			if (sawIngredient) break;
			const parsedOutput = Number(outputMatch[1]);
			if (Number.isFinite(parsedOutput) && parsedOutput > 0) {
				outputCount = parsedOutput;
			}
			continue;
		}
		const match = line.match(/^\|\s*ingredient(\d+)\s*=\s*(.+)$/i);
		if (!match) continue;
		const ordinal = Number(match[1]);
		if (sawIngredient && ordinal === 1) break;
		sawIngredient = true;
		const payload = match[2].trim();
		const parsed = payload.match(/^(\d+)\s+(.+)$/);
		if (!parsed) continue;
		const count = Number(parsed[1]);
		const name = parsed[2].trim();
		if (!name || !Number.isFinite(count) || count <= 0) continue;
		out.push({ name, count });
	}
	return { ingredients: out, outputCount };
}

function firstResultKey(results) {
	const keys = Object.keys(results || {});
	return keys.length ? keys[0] : null;
}

async function resolveGameIdByWikiPageTitle(pageTitle) {
	const query = encodeURIComponent(`[[${pageTitle}]]|?Has game id#`);
	const url = `https://wiki.guildwars2.com/api.php?action=ask&query=${query}&format=json&origin=*`;
	const json = await throttledFetchJson(url);
	const key = firstResultKey(json?.query?.results || {});
	if (!key) return null;
	const result = json.query.results[key];
	const values = result?.printouts?.['Has game id'];
	if (!Array.isArray(values) || !values.length) return null;
	const id = Number(values[0]);
	return Number.isFinite(id) && id > 0 ? id : null;
}

async function resolveWikiPageTitleByGameId(itemId) {
	const query = encodeURIComponent(`[[Has game id::${itemId}]][[Has context::Item]]|?Has game id#`);
	const url = `https://wiki.guildwars2.com/api.php?action=ask&query=${query}&format=json&origin=*`;
	const json = await throttledFetchJson(url);
	const key = firstResultKey(json?.query?.results || {});
	if (!key) return null;
	return key;
}

async function fetchWikiRecipeIngredientsForPage(pageTitle) {
	const sectionsUrl = `https://wiki.guildwars2.com/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&prop=sections&format=json&origin=*`;
	const sectionsJson = await throttledFetchJson(sectionsUrl);
	const sections = Array.isArray(sectionsJson?.parse?.sections) ? sectionsJson.parse.sections : [];
	const recipeSection = sections.find((s) => {
		const line = String(s?.line || '').toLowerCase();
		return line === 'recipe' || line === 'recipes' || line === 'acquisition';
	});
	if (!recipeSection?.index) {
		return { ingredients: [], outputCount: 1 };
	}

	const sectionIndex = String(recipeSection.index);
	const recipeUrl = `https://wiki.guildwars2.com/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&prop=wikitext&section=${encodeURIComponent(sectionIndex)}&format=json&origin=*`;
	const recipeJson = await throttledFetchJson(recipeUrl);
	const text = recipeJson?.parse?.wikitext?.['*'] || '';
	return parseWikiRecipeSectionWikitext(text);
}

function hasUsableCachedRecipe(entry) {
	if (!entry || typeof entry !== 'object') return false;
	if (entry.source === 'terminal') return false;
	const ingredients = Array.isArray(entry.ingredients) ? entry.ingredients : [];
	return ingredients.some((ingredient) => {
		const itemId = Number(ingredient?.item_id);
		const count = Number(ingredient?.count);
		return Number.isFinite(itemId) && itemId > 0 && Number.isFinite(count) && count > 0;
	});
}

async function main() {
	const legendaries = await readJson(LEGENDARIES_FILE, []);
	const recipesAll = await readJson(RECIPES_FILE, []);

	if (!Array.isArray(legendaries) || legendaries.length === 0) {
		throw new Error(
			`No legendary items loaded from ${LEGENDARIES_FILE}. Run scripts/export-legendaries-all.mjs or verify file location.`
		);
	}

	if (!Array.isArray(recipesAll) || recipesAll.length === 0) {
		throw new Error(
			`No recipes loaded from ${RECIPES_FILE}. Ensure recipies_all.json exists in project root.`
		);
	}

	const cache = await readJson(CACHE_FILE, {
		version: 1,
		createdAt: new Date().toISOString(),
		updatedAt: new Date().toISOString(),
		requestDelayMs: REQUEST_DELAY_MS,
		recipesByOutputId: {},
		unresolved: [],
	});

	const byOutput = buildApiRecipesByOutput(recipesAll);
	const recipesByOutputId = cache.recipesByOutputId || {};
	const unresolved = Array.isArray(cache.unresolved) ? cache.unresolved : [];

	const knownLegendaryIds = new Set(
		legendaries
			.map((x) => Number(x.id))
			.filter((id) => Number.isFinite(id) && id > 0)
	);
	const seedIds = SEED_IDS.length ? new Set(SEED_IDS) : knownLegendaryIds;

	const queue = [...seedIds];
	const queued = new Set(queue);
	const processed = new Set();

	for (const [outputId, record] of Object.entries(recipesByOutputId)) {
		const itemId = Number(outputId);
		if (!Number.isFinite(itemId) || itemId <= 0) continue;
		for (const ingredient of record?.ingredients || []) {
			const ingId = Number(ingredient?.item_id);
			if (!Number.isFinite(ingId) || ingId <= 0) continue;
			if (!queued.has(ingId)) {
				queue.push(ingId);
				queued.add(ingId);
			}
		}
	}

	let created = 0;
	let skipped = 0;
	let wikiResolved = 0;

	while (queue.length) {
		if (MAX_ITEMS > 0 && processed.size >= MAX_ITEMS) break;
		const itemId = Number(queue.shift());
		if (!Number.isFinite(itemId) || itemId <= 0) continue;
		if (processed.has(itemId)) continue;
		processed.add(itemId);

		if (hasUsableCachedRecipe(recipesByOutputId[String(itemId)])) {
			skipped += 1;
			continue;
		}

		const apiRecipes = byOutput.get(itemId) || [];
		if (apiRecipes.length) {
			const primary = selectPrimaryApiRecipe(apiRecipes);
			const ingredients = (primary.ingredients || []).map((x) => ({
				item_id: Number(x.item_id),
				count: Number(x.count),
				name: null,
			}));
			recipesByOutputId[String(itemId)] = {
				source: 'api',
				output_item_id: itemId,
				recipe_id: Number(primary.id),
				output_item_count: Number(primary.output_item_count || 1),
				ingredients,
				all_recipe_ids: apiRecipes.map((r) => Number(r.id)),
				fetched_at: new Date().toISOString(),
			};
			created += 1;
			for (const ing of ingredients) {
				const ingId = Number(ing.item_id);
				if (Number.isFinite(ingId) && ingId > 0 && !queued.has(ingId)) {
					queue.push(ingId);
					queued.add(ingId);
				}
			}
			continue;
		}

		let pageTitle = null;
		if (knownLegendaryIds.has(itemId)) {
			const fromLegendaries = legendaries.find((x) => Number(x.id) === itemId);
			if (fromLegendaries?.name) pageTitle = String(fromLegendaries.name);
		}
		if (!pageTitle) {
			pageTitle = await resolveWikiPageTitleByGameId(itemId).catch(() => null);
		}

		if (!pageTitle) {
			recipesByOutputId[String(itemId)] = {
				source: 'terminal',
				output_item_id: itemId,
				recipe_id: null,
				output_item_count: 1,
				ingredients: [],
				terminal_reason: 'missing-page-title',
				fetched_at: new Date().toISOString(),
			};
			created += 1;
			continue;
		}

		const wikiRecipe = await fetchWikiRecipeIngredientsForPage(pageTitle).catch(() => ({ ingredients: [], outputCount: 1 }));
		const wikiIngredients = wikiRecipe.ingredients;
		if (!wikiIngredients.length) {
			recipesByOutputId[String(itemId)] = {
				source: 'terminal',
				output_item_id: itemId,
				recipe_id: null,
				output_item_count: 1,
				wiki_page: pageTitle,
				ingredients: [],
				terminal_reason: 'wiki-recipe-missing',
				fetched_at: new Date().toISOString(),
			};
			created += 1;
			continue;
		}

		const normalizedIngredients = [];
		for (const ingredient of wikiIngredients) {
			const ingId = await resolveGameIdByWikiPageTitle(ingredient.name).catch(() => null);
			normalizedIngredients.push({
				item_id: ingId,
				count: Number(ingredient.count),
				name: ingredient.name,
			});
			if (Number.isFinite(Number(ingId)) && Number(ingId) > 0 && !queued.has(Number(ingId))) {
				queue.push(Number(ingId));
				queued.add(Number(ingId));
			}
		}

		recipesByOutputId[String(itemId)] = {
			source: 'wiki',
			output_item_id: itemId,
			recipe_id: null,
			output_item_count: Number(wikiRecipe.outputCount || 1),
			wiki_page: pageTitle,
			ingredients: normalizedIngredients,
			fetched_at: new Date().toISOString(),
		};
		wikiResolved += 1;
		created += 1;
	}

	cache.version = 1;
	cache.updatedAt = new Date().toISOString();
	cache.requestDelayMs = REQUEST_DELAY_MS;
	cache.recipesByOutputId = recipesByOutputId;
	cache.unresolved = unresolved;
	cache.stats = {
		created,
		skipped,
		wikiResolved,
		processed: processed.size,
		cachedOutputs: Object.keys(recipesByOutputId).length,
	};

	const serializedCache = `${JSON.stringify(cache, null, 2)}\n`;
	await fs.mkdir(path.dirname(CACHE_FILE), { recursive: true });
	await fs.writeFile(CACHE_FILE, serializedCache, 'utf8');
	if (CACHE_FILE !== STATIC_CACHE_FILE) {
		await fs.mkdir(path.dirname(STATIC_CACHE_FILE), { recursive: true });
		await fs.writeFile(STATIC_CACHE_FILE, serializedCache, 'utf8');
	}

	console.log(
		`Cache updated: created=${created}, skipped=${skipped}, wikiResolved=${wikiResolved}, outputs=${Object.keys(recipesByOutputId).length}`
	);
	console.log(`Saved ${CACHE_FILE}`);
	if (CACHE_FILE !== STATIC_CACHE_FILE) {
		console.log(`Synced ${STATIC_CACHE_FILE}`);
	}
}

main().catch((error) => {
	console.error(error instanceof Error ? error.message : String(error));
	process.exit(1);
});
