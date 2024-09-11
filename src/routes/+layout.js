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
			tokenInfo = await apiService.tokenInfo();
			// console.log('tokenInfo', tokenInfo);
			if (!tokenInfo.name) {
				if (tokenInfo) {
					returnObj.tokenInfo.error = tokenInfo;
					returnObj.reminders = {};
					returnObj.remindersSettings = {};
					}
			} else {
				returnObj.tokenInfo = tokenInfo;
				returnObj.reminders = await utils.readReminders();
				returnObj.remindersSettings = await utils.readRemindersSettings();
			}
		} catch (error) {
			console.log('Layout load error', error)
		}
	} 
	return returnObj;
}
