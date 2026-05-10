import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, parent }) => {
	const { apiService } = await parent();
	const key = apiService.getApiKey();
	return {
		'account': key ? apiService.account() : [],
		'tokenInfo': apiService.tokenInfo(),
	};
};
