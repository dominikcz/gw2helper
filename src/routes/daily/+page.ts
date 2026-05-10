import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, parent }) => {
	const { apiService, toDoList } = await parent();
	const key = apiService.getApiKey();
	type DailyLoadResult = {
		wallet: unknown[] | Promise<unknown[]>;
		daily: Record<string, unknown> | Promise<Record<string, unknown>>;
		weekly: Record<string, unknown> | Promise<Record<string, unknown>>;
		special: Record<string, unknown> | Promise<Record<string, unknown>>;
		achievements: Record<string, unknown> | Promise<Record<string, unknown>>;
		toDoList: unknown;
		seasonEnd: string | null;
		account?: Promise<Record<string, unknown>>;
	};

	const returnObj: DailyLoadResult = {
		wallet: [],
		daily: {},
		weekly: {},
		special: {},
		achievements: {},
		toDoList,
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
};
