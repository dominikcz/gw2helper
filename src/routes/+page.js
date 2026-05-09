import utils from '$lib/utils.js';

export async function load({ fetch, parent }) {
	const { apiService } = await parent();
	const key = apiService.getApiKey();
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
}
