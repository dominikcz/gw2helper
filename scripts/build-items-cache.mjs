/**
 * GW2 Items Cache Builder
 *
 * Downloads all items from GW2 API and caches them locally.
 * Output: scripts/.cache/gw2_all_items.json
 *
 * TTL: 7 days (skip download if cache is fresh), unless GW2W_FORCE_REDOWNLOAD=1
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_DIR = path.join(__dirname, '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'gw2_all_items.json');
const GW2_API = 'https://api.guildwars2.com';
const API_BATCH_SIZE = 200;
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const FORCE_REDOWNLOAD = process.env.GW2W_FORCE_REDOWNLOAD === '1';

const HEADERS = { 'User-Agent': 'gw2helper-cache-bot/2.0', Accept: 'application/json' };

async function apiFetch(url) {
	const res = await fetch(url, { headers: HEADERS });
	if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
	return res.json();
}

async function isCacheFresh() {
	try {
		const stat = await fs.stat(CACHE_FILE);
		return Date.now() - stat.mtimeMs < CACHE_TTL_MS;
	} catch {
		return false;
	}
}

async function main() {
	console.log('=== GW2 Items Cache Builder ===');

	if (!FORCE_REDOWNLOAD && (await isCacheFresh())) {
		const stat = await fs.stat(CACHE_FILE);
		const ageDays = ((Date.now() - stat.mtimeMs) / (1000 * 60 * 60 * 24)).toFixed(1);
		console.log(`[items] Cache is fresh (age: ${ageDays}d), skipping download. Use GW2W_FORCE_REDOWNLOAD=1 to force.`);
		return;
	}

	console.log('[items] Fetching all item IDs from GW2 API...');
	const allIds = await apiFetch(`${GW2_API}/v2/items`);
	if (!Array.isArray(allIds)) throw new Error('Failed to fetch /v2/items');
	console.log(`[items] Got ${allIds.length} item IDs, downloading details...`);

	const batches = [];
	for (let i = 0; i < allIds.length; i += API_BATCH_SIZE) {
		batches.push(allIds.slice(i, i + API_BATCH_SIZE));
	}

	const allItems = [];
	for (let i = 0; i < batches.length; i++) {
		const batch = batches[i];
		const url = `${GW2_API}/v2/items?ids=${batch.join(',')}`;
		const data = await apiFetch(url);
		if (Array.isArray(data)) {
			for (const item of data) {
				allItems.push({
					id: item.id,
					name: item.name,
					icon: item.icon ?? null,
					rarity: item.rarity,
					type: item.type,
					flags: item.flags ?? [],
					isRecipeScroll: !!(item.details?.recipe_id),
				});
			}
		}
		if ((i + 1) % 20 === 0 || i === batches.length - 1) {
			console.log(`[items] Batch ${i + 1}/${batches.length} (${allItems.length} items so far)`);
		}
	}

	await fs.mkdir(CACHE_DIR, { recursive: true });
	await fs.writeFile(CACHE_FILE, JSON.stringify(allItems), 'utf8');
	console.log(`[items] Saved ${allItems.length} items to disk`);
}

main().catch((err) => {
	console.error('[items] Fatal error:', err);
	process.exit(1);
});
