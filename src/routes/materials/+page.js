export async function load({ fetch, parent }) {
    const { apiService } = await parent();
	return {
		materials: apiService.apiKey ? apiService.materials() : [],
	};
}
