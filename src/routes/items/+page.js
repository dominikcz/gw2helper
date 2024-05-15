export const ssr = false;

export async function load({ fetch, parent }) {
    const { apiService } = await parent();
	return {
		bank: await apiService.bank(),
		characters: await apiService.charactersItems(),
		shared: await apiService.sharedInventory(),
	};
}
