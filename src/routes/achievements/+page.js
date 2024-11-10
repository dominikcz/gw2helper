export const ssr = false;

import utils from '$lib/utils';

export async function load({ fetch, parent }) {
    const { apiService, todo } = await parent();
	return {
		achievements: apiService.getApiKey() ? apiService.achievements(false) : [],
		todo,
		settings: utils.readAchievementsSettings(),
	};
}
