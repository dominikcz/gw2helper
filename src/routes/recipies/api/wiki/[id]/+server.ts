import { json } from '@sveltejs/kit';

const TIMEOUT_MS = 30_000;

function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
	return Promise.race([
		promise,
		new Promise<never>((_, reject) =>
			setTimeout(() => reject(new Error('Timeout')), ms)
		),
	]);
}

export async function GET({ params }: { params: { id: string } }) {
	const id = parseInt(params.id, 10);
	if (!Number.isInteger(id) || id <= 0) {
		return json({ error: 'Invalid id' }, { status: 400 });
	}

	try {
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore – runtime-only ESM import of a .mjs script
		const wikiUtils = await import('../../../../../../scripts/lib/wiki-utils.mjs');

		const pageTitle: string | null = await withTimeout(
			wikiUtils.wikiResolvePageByGameId(id),
			TIMEOUT_MS
		);

		if (!pageTitle) {
			return json({ error: 'Wiki page not found' }, { status: 404 });
		}

		const leadUrl = `https://wiki.guildwars2.com/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&prop=wikitext&section=0&format=json&origin=*`;
		const [recipeResult, acquisition, leadJson] = await withTimeout(
			Promise.all([
				wikiUtils.fetchWikiRecipe(pageTitle, id),
				wikiUtils.fetchWikiAcquisition(pageTitle),
				fetch(leadUrl, { headers: { 'User-Agent': 'gw2helper/2.0' } }).then((r: Response) => r.json()).catch(() => null),
			]),
			TIMEOUT_MS
		);

		const leadText = leadJson?.parse?.wikitext?.['*'] ?? '';
		const infobox = wikiUtils.parseInfobox(leadText);

		// Attach recipeType from infobox if recipe didn't already set it
		const recipe = recipeResult
			? { ...recipeResult, recipeType: recipeResult.recipeType ?? infobox.type ?? null }
			: (infobox.type ? { ingredients: [], outputCount: 1, outputItemId: null, disciplines: [], recipeType: infobox.type } : null);

		return json({ pageTitle, recipe, acquisition });
	} catch (err) {
		const message = err instanceof Error ? err.message : 'Unknown error';
		if (message === 'Timeout') {
			return json({ error: 'Wiki request timed out' }, { status: 504 });
		}
		return json({ error: message }, { status: 500 });
	}
}
