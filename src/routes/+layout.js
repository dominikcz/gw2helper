export const ssr = false;
export const trailingSlash = 'always';

import utils from "$lib/utils";
import apiService from "$lib/apiService.ts";

export async function load( { fetch } ) {
	const key = utils.readApiKey();
	if (key){
		apiService.init(key, {fetchFunction: fetch });
		return {
			apiKey: key,
			'apiService': apiService,
			'wallet': apiService.wallet(),
			'tokenInfo': await apiService.tokenInfo(),
		};
	} else {
		return {
			apiKey: '',
			'tokenInfo': {
				name: null,
				permissions: [],
			},
			'wallet': []
		};
	}
}
