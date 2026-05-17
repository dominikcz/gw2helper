import type { PageLoad } from './$types';
import type { AchievementsData } from '$lib/components/achievements/achievements';
import {
	EMPTY_ACCOUNT_DATA,
	type AccountWithLocalDates,
	type WalletCurrency,
	type WizardsVaultCategoryData,
} from '$lib/types/gw2-api';

export const load: PageLoad = async ({ fetch, parent }) => {
	const { apiService, toDoList } = await parent();
	const key = apiService.getApiKey();
	type DailyLoadResult = {
		wallet: WalletCurrency[] | Promise<WalletCurrency[]>;
		daily: WizardsVaultCategoryData | Promise<WizardsVaultCategoryData>;
		weekly: WizardsVaultCategoryData | Promise<WizardsVaultCategoryData>;
		special: WizardsVaultCategoryData | Promise<WizardsVaultCategoryData>;
		achievements: (AchievementsData & { rewards_to_get: Map<string, number> }) | Promise<AchievementsData & { rewards_to_get: Map<string, number> }>;
		toDoList: Promise<number[]>;
		seasonEnd: string | null;
		account: AccountWithLocalDates | Promise<AccountWithLocalDates>;
	};

	const emptyAchievements: AchievementsData & { rewards_to_get: Map<string, number> } = {
		completed: 0,
		todo: 0,
		daily_ap: 0,
		monthly_ap: 0,
		categories: [],
		rewards_to_get: new Map<string, number>(),
	};

	const returnObj: DailyLoadResult = {
		wallet: [],
		daily: {},
		weekly: {},
		special: {},
		achievements: emptyAchievements,
		toDoList,
		seasonEnd: null,
		account: EMPTY_ACCOUNT_DATA,
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
