import utils from "$lib/utils";

export async function load({ fetch, parent }) {
    const { apiService } = await parent();
	const key = await utils.readApiKey();
	if (key){
		return {
			'account': apiService.apiKey ? apiService.account() : [],
			'wallet': apiService.apiKey ? apiService.wallet() : [],
			'delivery': apiService.apiKey ? apiService.delivery() : [],
		};
	} else {
		return {
			'account': {},
			'wallet': [],
			'delivery': {},
		};
	}
}
