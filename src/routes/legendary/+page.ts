import type { PageLoad } from './$types';
import { EMPTY_LEGENDARIES_DATA } from '$lib/types/gw2-api';

export const load: PageLoad = async ({ fetch, parent }) => {
	const { apiService } = await parent();
	const key = apiService.getApiKey();
	return {
		legendaries: key ? apiService.legendaries() : EMPTY_LEGENDARIES_DATA,
	};
};
