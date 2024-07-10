import utils from "$lib/utils";

export async function load({ fetch, parent }) {
    const { apiService } = await parent();
	const key = utils.readApiKey();
	if (key){
		return {
			'account': apiService.account(),
			'wallet': apiService.wallet(),
		};
	} else {
		return {
			'account': {},
			'wallet': [],
		};
	}
}
