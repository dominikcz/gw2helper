export async function load({ fetch, parent }) {
	const { apiService } = await parent();
	const key = apiService.getApiKey();
	if (key) {
		return {
			'account': key ? apiService.account() : [],
			'wallet': key ? apiService.wallet() : [],
			'delivery': key ? apiService.delivery() : [],
		};
	} else {
		console.log('no api key :(');
		return {
			'account': {},
			'wallet': [],
			'delivery': {},
		};
	}
}
