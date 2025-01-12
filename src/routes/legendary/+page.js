export async function load({ fetch, parent }) {
    const { apiService } = await parent();
	const key = apiService.getApiKey();
	return {
		legendaries: key ? apiService.legendaries() : [],
	};
}
