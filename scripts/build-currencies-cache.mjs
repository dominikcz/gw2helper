/**
 * GW2 Currencies Cache Builder
 *
 * Downloads all currencies from GW2 API and caches them locally.
 * Output: scripts/.cache/gw2_currencies.json
 *
 * TTL: 30 days (skip download if cache is fresh), unless GW2W_FORCE_REDOWNLOAD=1
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CACHE_DIR = path.join(__dirname, '.cache');
const CACHE_FILE = path.join(CACHE_DIR, 'gw2_currencies.json');
const GW2_API = 'https://api.guildwars2.com';
const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const FORCE_REDOWNLOAD = process.env.GW2W_FORCE_REDOWNLOAD === '1';

const HEADERS = { 'User-Agent': 'gw2helper-cache-bot/2.0', Accept: 'application/json' };

async function isCacheFresh() {
	try {
		const stat = await fs.stat(CACHE_FILE);
		return Date.now() - stat.mtimeMs < CACHE_TTL_MS;
	} catch {
		return false;
	}
}

async function main() {
	console.log('=== GW2 Currencies Cache Builder ===');

	if (!FORCE_REDOWNLOAD && (await isCacheFresh())) {
		const stat = await fs.stat(CACHE_FILE);
		const ageDays = ((Date.now() - stat.mtimeMs) / (1000 * 60 * 60 * 24)).toFixed(1);
		console.log(`[currencies] Cache is fresh (age: ${ageDays}d), skipping download. Use GW2W_FORCE_REDOWNLOAD=1 to force.`);
		return;
	}

	console.log('[currencies] Fetching all currencies from GW2 API...');
	const res = await fetch(`${GW2_API}/v2/currencies?ids=all`, { headers: HEADERS });
	if (!res.ok) throw new Error(`HTTP ${res.status} fetching currencies`);
	const data = await res.json();
	if (!Array.isArray(data)) throw new Error('Unexpected response from /v2/currencies');

	const currencies = data.map((c) => ({
		id: c.id,
		name: c.name,
		icon: c.icon ?? null,
		description: c.description ?? '',
		order: c.order ?? 0,
	}));

	console.log(`[currencies] Fetched ${currencies.length} currencies`);

	await fs.mkdir(CACHE_DIR, { recursive: true });
	await fs.writeFile(CACHE_FILE, JSON.stringify(currencies), 'utf8');
	console.log('[currencies] Saved to disk');
}

main().catch((err) => {
	console.error('[currencies] Fatal error:', err);
	process.exit(1);
});
