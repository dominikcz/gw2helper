export const ssr = false;
export const trailingSlash = 'always';

import utils from "$lib/utils";
import apiService from "$lib/apiService.ts";

console.log(__NAME__, __VERSION__);

export async function load( { fetch } ) {
	// const apiService = await import("$lib/apiService.ts");
	const dummyTokenInfo = {
		name: null,
		permissions: [],
		error: 'invalid token key',
	};
	const key = await utils.readApiKey();
	const apiKeyHist = await utils.getKeyHist();
	if (key){
		await apiService.init(key, {fetchFunction: fetch });
		let tokenInfo = await apiService.tokenInfo();
		if (!tokenInfo.permissions) {
			tokenInfo = dummyTokenInfo;
		}
		return {
			version: __VERSION__,
			apiKey: key,
			apiKeyHist,
			'apiService': apiService,
			'tokenInfo': tokenInfo,
		};
	} else {
		return {
			version: __VERSION__,
			apiKey: '',
			apiKeyHist: [],
			'tokenInfo': dummyTokenInfo
		};
	}
}
