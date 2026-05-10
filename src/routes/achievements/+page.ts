export const ssr = false;

import type { PageLoad } from './$types';

import utils from '$lib/utils';

export const load: PageLoad = async ({ fetch, parent }) => {
	const { apiService, toDoList } = await parent();
	return {
		achievements: apiService.getApiKey() ? apiService.achievements(false) : [],
		toDoList,
		settings: utils.readAchievementsSettings(),
	};
};
