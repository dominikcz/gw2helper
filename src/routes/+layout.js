export const ssr = false;
export const trailingSlash = 'always';

import utils from "$lib/utils";
import apiService from "$lib/apiService.ts";

export async function load( { fetch } ) {
	const key = utils.readApiKey();
	apiService.init(key, {fetchFunction: fetch });
	const tokenInfo = await apiService.tokenInfo();
	console.log('tokenInfo', tokenInfo);
	return {
		apiKey: key,
		'tokenInfo': tokenInfo,
		'apiService': apiService,
	};
}
