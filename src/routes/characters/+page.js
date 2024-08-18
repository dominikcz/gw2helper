export async function load({ fetch, parent }) {
    const { apiService } = await parent();
	return {
		characters: apiService.apiKey ? apiService.characters() : [],
	};
}
