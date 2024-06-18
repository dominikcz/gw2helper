export async function load({ fetch, parent }) {
    const { apiService } = await parent();
	return {
		bank: apiService.bank(),
		shared: apiService.sharedInventory(),
		characterItems: apiService.charactersItems(),
		guildItems: apiService.guildItems(),
	};
}
