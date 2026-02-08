export async function load({ fetch, parent }) {
	const { apiService, todo } = await parent();
	const key = apiService.getApiKey();
	const returnObj = {
		wallet: [],
		daily: {},
		weekly: {},
		special: {},
		achievements: {},
		todo,
		seasonEnd: null,
	};
	if (key) {
		returnObj.account = apiService.account();
		returnObj.wallet = apiService.wallet();
		returnObj.daily = apiService.wizardsVaultDaily();
		returnObj.weekly = apiService.wizardsVaultWeekly();
		returnObj.special = apiService.wizardsVaultSpecial();
		returnObj.achievements = apiService.achievements();
		returnObj.seasonEnd = apiService.wizardsVault().seasonEnd;
	} else {
		console.log('no api key :(');
		
	}
	return returnObj;
}
