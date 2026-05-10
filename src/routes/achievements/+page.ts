export const ssr = false;

import type { PageLoad } from './$types';

import utils from '$lib/utils';
import type { AchievementsData } from '$lib/components/achievements/achievements';

const EMPTY_ACHIEVEMENTS: AchievementsData & { rewards_to_get: Map<string, number> } = {
	completed: 0,
	todo: 0,
	daily_ap: 0,
	monthly_ap: 0,
	categories: [],
	rewards_to_get: new Map<string, number>(),
};

export const load: PageLoad = async ({ fetch, parent }) => {
	const { apiService, toDoList } = await parent();
	return {
		achievements: apiService.getApiKey() ? apiService.achievements(false) : EMPTY_ACHIEVEMENTS,
		toDoList,
		settings: utils.readAchievementsSettings(),
	};
};
