import type { PageLoad } from './$types';
import { EMPTY_ACCOUNT_DATA } from '$lib/types/gw2-api';

export const load: PageLoad = async ({ fetch, parent }) => {
	const { apiService } = await parent();
	const key = apiService.getApiKey();
	return {
		'account': key ? apiService.account() : EMPTY_ACCOUNT_DATA,
		'tokenInfo': apiService.tokenInfo(),
	};
};
