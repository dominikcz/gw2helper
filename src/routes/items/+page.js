export async function load({ fetch, parent }) {
    const { apiService } = await parent();
	return {
		bank: apiService.apiKey ? apiService.bank() : [],
		shared: apiService.apiKey ? apiService.sharedInventory() : [],
		characterItems: apiService.apiKey ? apiService.charactersItems() : [],
		guildItems: apiService.apiKey ? apiService.guildItems() : [],
	};
}
