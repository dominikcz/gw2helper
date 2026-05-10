import type { PageLoad } from './$types';
import utils from '$lib/utils';

export const load: PageLoad = async ({ fetch, parent }) => {
	const { apiService } = await parent();
	const key = apiService.getApiKey();
	/** @type {number[]} */
	const walletOrder = await utils.readWalletOrder();
	if (key) {
		return {
			'wallet': apiService.wallet(walletOrder),
			'delivery': apiService.delivery(),
		};
	} else {
		console.log('no api key :(');
		return {
			'wallet': [],
			'delivery': { coins: 0, items: [] },
		};
	}
};
