import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, parent }) => {
	const { apiService } = await parent();
	const key = apiService.getApiKey();
	return {
		bank: key ? apiService.bank() : [],
		shared: key ? apiService.sharedInventory() : [],
		charactersItems: key ? apiService.charactersItems() : [],
		guildItems: key ? apiService.guildItems() : [],
	};
};
