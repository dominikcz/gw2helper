export const ssr = false;
export const trailingSlash = 'always';

import utils from "$lib/utils";
import apiService from "$lib/apiService.ts";

console.log(__NAME__, __VERSION__);

export async function load( { fetch } ) {
	const key = utils.readApiKey();
	if (key){
		apiService.init(key, {fetchFunction: fetch });
		return {
			version: __VERSION__,
			apiKey: key,
			'apiService': apiService,
			'tokenInfo': await apiService.tokenInfo(),
		};
	} else {
		return {
			version: __VERSION__,
			apiKey: '',
			'tokenInfo': {
				name: null,
				permissions: [],
			},
		};
	}
}
