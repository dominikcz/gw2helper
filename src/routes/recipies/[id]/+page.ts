export const ssr = false;
import { resolve } from '$app/paths';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, url, fetch }) => {
	const id = Number(params.id);
	const stack = url.searchParams.get('stack') ?? '';
	const back = url.searchParams.get('back') ?? '';

	let existingRecipes: any[] = [];
	try {
		const res = await fetch(resolve(`/recipies/api/recipe/${id}`));
		if (res.ok) existingRecipes = await res.json();
	} catch {}

	let outputItem: { id: number; name: string; icon: string | null; rarity: string; type?: string } | null = null;
	let stackItems: Record<number, string> = {};

	// Fetch names for current item + all stack IDs in one request
	const stackIds = stack ? stack.split(',').map(Number).filter(n => n > 0) : [];
	const allIds = [...new Set([id, ...stackIds])];
	try {
		const res = await fetch(resolve('/recipies/api/items') + `?ids=${allIds.join(',')}`);
		if (res.ok) {
			const { items } = await res.json();
			for (const item of items) {
				if (item.id === id) outputItem = { id: item.id, name: item.name, icon: item.icon, rarity: item.rarity, type: item.type };
				else stackItems[item.id] = item.name;
			}
		}
	} catch {}

	return { id, stack, back, existingRecipes, outputItem, stackItems };
};
