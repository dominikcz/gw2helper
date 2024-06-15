export const ssr = false;
export const trailingSlash = 'always';

import utils from "$lib/utils";
import apiService from "$lib/apiService.ts";

export async function load( { fetch } ) {
	const key = utils.readApiKey();
	if (key){
		apiService.init(key, {fetchFunction: fetch });
		const [tokenInfo, wallet] = await Promise.all([
			apiService.tokenInfo(),
			apiService.wallet()
		]);
		return {
			apiKey: key,
			'tokenInfo': tokenInfo,
			'apiService': apiService,
			'wallet': wallet,
		};
	} else {
		return {
			apiKey: '',
			'tokenInfo': {
				name: null,
				permissions: [],
			},
		};
	}
}
