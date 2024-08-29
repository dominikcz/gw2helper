export async function load({ fetch, parent }) {
	const { apiService } = await parent();
	const key = apiService.getApiKey();
	if (key) {
		return {
			'wallet': key ? apiService.wallet() : [],
			'daily': key ? apiService.wizardsVaultDaily() : {},
			'weekly': key ? apiService.wizardsVaultWeekly() : {},
			'special': key ? apiService.wizardsVaultSpecial() : {},
		};
	} else {
		console.log('no api key :(');
		return {
			'wallet': [],
			'daily': {},
			'weekly': {},
			'special': {},
		};
	}
}
