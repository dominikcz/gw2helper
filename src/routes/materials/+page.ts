import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, parent }) => {
	const { apiService } = await parent();
	return {
		materials: apiService.getApiKey() ? apiService.materials() : [],
	};
};
