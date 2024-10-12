export const ssr = false;
export const trailingSlash = 'always';
// export const prerender = true;

import utils from "$lib/utils";
import apiService from "$lib/apiService";

import { loadTranslations, t as _ } from '$lib/services/i18n';

console.log(__NAME__, __VERSION__);

export async function load({ fetch, url }) {
	const { pathname } = url;

	const initLocale = utils.readLang();

	await loadTranslations(initLocale, pathname);
	let no_token = _.get('layout.no_token');
	console.log('initialized');

	const key = await utils.readApiKey();
	// const apiService = await import("$lib/apiService.ts");
	const dummyTokenInfo = {
		name: null,
		permissions: [],
		error: no_token,
	};
	let apiLang = await utils.readApiLang();
	const apiKeyHist = await utils.getKeyHist();
	let tokenInfo = dummyTokenInfo;

	const returnObj = {
		version: __VERSION__,
		apiKey: key,
		apiKeyHist,
		tokenInfo,
		apiService,
		apiLang,
	};

	console.log('key', key);
	if (key) {
		await apiService.init(key, { apiLang, fetchFunction: fetch });
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
