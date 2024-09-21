export const ssr = false;
export const trailingSlash = 'always';

import utils from "$lib/utils";
import apiService from "$lib/apiService";

import { initi18n } from '$lib/services/i18n';
import { locale } from 'svelte-i18n'
import { lang } from "$lib/stores/lang.js";

console.log(__NAME__, __VERSION__);

export async function load({ fetch }) {
	console.log('load')
	await lang.init();
	initi18n();

	const key = await utils.readApiKey();
	// const apiService = await import("$lib/apiService.ts");
	const dummyTokenInfo = {
		name: null,
		permissions: [],
		error: 'invalid API key',
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
	locale.set('en');
	return returnObj;
}
