export async function load({ fetch, parent }) {
    const { apiService } = await parent();
	const key = apiService.getApiKey();
	return {
		bank: key ? apiService.bank() : [],
		shared: key ? apiService.sharedInventory() : [],
		charactersItems: key ? apiService.charactersItems() : [],
		guildItems: key ? apiService.guildItems() : [],
	};
}
