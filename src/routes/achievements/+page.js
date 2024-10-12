export const ssr = false;

import utils from '$lib/utils';

export async function load({ fetch, parent }) {
    const { apiService } = await parent();
	return {
		achievements: apiService.getApiKey() ? apiService.achievements(false) : [],
		todo: utils.readAchievementsToDo(),
		settings: utils.readAchievementsSettings(),
	};
}
