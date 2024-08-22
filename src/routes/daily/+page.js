export async function load({ fetch, parent }) {
	const { apiService } = await parent();
	const key = apiService.getApiKey();
	if (key) {
		return {
			'daily': key ? apiService.wizardsVaultDaily() : [],
			'weekly': key ? apiService.wizardsVaultWeekly() : [],
			'special': key ? apiService.wizardsVaultSpecial() : [],
		};
	} else {
		console.log('no api key :(');
		return {
			'daily': {},
			'weekly': [],
			'special': {},
		};
	}
}
