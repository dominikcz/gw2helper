export const ssr = false;

import utils from '$lib/utils';

export async function load({ fetch, parent }) {
    const { apiService, toDoList } = await parent();
	return {
		achievements: apiService.getApiKey() ? apiService.achievements(false) : [],
		toDoList,
		settings: utils.readAchievementsSettings(),
	};
}
