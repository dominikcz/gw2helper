export const ssr = false;

import type { PageLoad } from './$types';
import { EMPTY_DELIVERY_DATA, EMPTY_TRANSACTIONS_CURRENT } from '$lib/types/gw2-api';

export const load: PageLoad = async ({ fetch, parent }) => {
	const { apiService } = await parent();
	const key = apiService.getApiKey();
	return {
		current: key ? apiService.transactionsCurrent() : EMPTY_TRANSACTIONS_CURRENT,
		delivery: key ? apiService.delivery() : EMPTY_DELIVERY_DATA,
	};
};