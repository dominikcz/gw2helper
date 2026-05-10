export const ssr = false;

import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, parent }) => {
	const { apiService } = await parent();
	const key = apiService.getApiKey();
	return {
		current: key ? apiService.transactionsCurrent() : { buys: [], sells: [] },
		delivery: key ? apiService.delivery() : { coins: 0, items: [] },
	};
};