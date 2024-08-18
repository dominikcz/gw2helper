export const ssr = false;

import utils from '$lib/utils';

export async function load({ fetch, parent }) {
    const { apiService } = await parent();
	return {
		achievements: apiService.apiKey ? apiService.achievements(false) : [],
		todo: utils.readAchievesToDo(),
		settings: utils.readAchievesSettings(),
	};
}
