import { json } from '@sveltejs/kit';
import { readFileSync, existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.join(__dirname, '../../../../../');
const CACHE_PATH = path.join(PROJECT_ROOT, 'scripts/.cache/gw2_currencies.json');

interface CachedCurrency {
	id: number;
	name: string;
	icon: string | null;
	description: string;
	order: number;
}

let currenciesCache: CachedCurrency[] | null = null;

function loadCurrencies(): CachedCurrency[] {
	if (currenciesCache) return currenciesCache;
	if (!existsSync(CACHE_PATH)) return [];
	currenciesCache = JSON.parse(readFileSync(CACHE_PATH, 'utf-8')) as CachedCurrency[];
	return currenciesCache;
}

export async function GET({ url }: { url: URL }) {
	const q = url.searchParams.get('q')?.trim().toLowerCase() ?? '';
	const currencies = loadCurrencies();
	const results = q
		? currencies.filter((c) => c.name.toLowerCase() === q)
		: currencies;
	return json({ currencies: results });
}
