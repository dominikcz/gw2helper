export async function load({ fetch, parent }) {
	const { apiService } = await parent();
	const key = apiService.getApiKey();
	if (key) {
		return {
			'account': key ? apiService.account() : [],
		};
	} else {
		return {
			'account': {},
		};
	}
}
