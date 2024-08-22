export async function load({ fetch, parent }) {
    const { apiService } = await parent();
	return {
		characters: apiService.getApiKey() ? apiService.characters() : [],
	};
}
