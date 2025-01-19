export async function load({ fetch, parent }) {
	const { apiService } = await parent();
	const key = apiService.getApiKey();
	return {
		'account': key ? apiService.account() : [],
		'tokenInfo': apiService.tokenInfo(),
	};
}
