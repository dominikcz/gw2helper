export const ssr = false;
export const trailingSlash = 'always';
// export const prerender = true;

import utils from "$lib/utils";
import apiService from "$lib/apiService";

import { loadTranslations, t as _ } from '$lib/services/i18n';
import ReminderSettings from "$lib/services/reminderSettings.svelte";

console.log(__NAME__, __VERSION__);

export async function load({ fetch, url }) {
	const { pathname } = url;

	const initLocale = utils.readLang();

	await loadTranslations(initLocale, pathname);
	let no_token = _.get('layout.no_token');
	console.log('initialized');

	const key = await utils.readApiKey();
	// const apiService = await import("$lib/apiService.ts");
	let apiLang = await utils.readApiLang();
	const apiKeyHist = await utils.getKeyHist();

	const returnObj = {
		version: __VERSION__,
		apiKey: key,
		apiKeyHist,
		apiService,
		apiLang,
		toDoList: utils.readAchievementsToDo(),
		remindersSettings: new ReminderSettings(),
	};

	console.log('key', key);
	if (key) {
		await apiService.init(key, { apiLang, fetchFunction: fetch });
		returnObj.tokenInfo = apiService.tokenInfo();
		if (!returnObj.tokenInfo.name) {
			if (!returnObj.tokenInfo.error) {
				returnObj.tokenInfo.error = no_token;
			}
			returnObj.reminders = {};
		} else {
			apiService.startSession();
			returnObj.reminders = await utils.readReminders();
		}
		// console.log(returnObj.tokenInfo)
	}

	return returnObj;
}
