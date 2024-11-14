export const ssr = false;

import utils from '$lib/utils';

export async function load({ fetch, parent }) {
    const { apiService } = await parent();
	const key = apiService.getApiKey();
	return {
		current: apiService.transactionsCurrent(),
	};
}