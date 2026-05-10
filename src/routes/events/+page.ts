import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch, parent }) => {
	return await parent();
};
