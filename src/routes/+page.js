import utils from "$lib/utils";

export async function load({ fetch, parent }) {
    const { apiService } = await parent();
	const key = await utils.readApiKey();
	if (key){
		return {
			'account': apiService.account(),
			'wallet': apiService.wallet(),
			'delivery': apiService.delivery(),
		};
	} else {
		return {
			'account': {},
			'wallet': [],
			'delivery': {},
		};
	}
}
