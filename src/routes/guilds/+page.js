export async function load({ fetch, parent }) {
    const { apiService } = await parent();
	return {
		guilds: apiService.getApiKey() ? apiService.guilds() : [],
	};
}
