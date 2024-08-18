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
	let tokenInfo = dummyTokenInfo;

	const returnObj = {
		version: __VERSION__,
		apiKey: key,
		apiKeyHist,
		tokenInfo,
		apiService,
	};

	console.log('key', key);
	if (key){
		await apiService.init(key, {fetchFunction: fetch });
		try {
			const _tokenInfo = await apiService.tokenInfo();
			console.log('_tokenInfo', _tokenInfo);
			if (!_tokenInfo.permissions) {
				if (_tokenInfo) {
					tokenInfo.error = _tokenInfo;
				}
			} else {
				returnObj.tokenInfo = _tokenInfo;
				returnObj.apiService = apiService; 
			}
		} catch (error) {
			console.log('Layout load error', error)
		}
	} 
	return returnObj;
}
