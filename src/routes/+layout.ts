export const ssr = false;
export const trailingSlash = 'always';
// export const prerender = true;
/* global __NAME__, __VERSION__ */

import type { LayoutLoad } from './$types';

import utils from "$lib/utils";
import apiService from "$lib/apiService";
import Logger from '$lib/logger';

import { loadTranslations, t as _ } from '$lib/services/i18n';
import ReminderSettings from "$lib/services/reminderSettings.svelte";

// @ts-ignore vite define
Logger.always(__NAME__, __VERSION__);

export const load: LayoutLoad = async ({ fetch, url }) => {
	const { pathname } = url;

	const initLocale = utils.readLang() || 'en';

	await loadTranslations(initLocale, pathname);
	let no_token = _.get('layout.no_token');
    Logger.log('translations initialized', { initLocale, pathname });

	const key = await utils.readApiKey();
	Logger.always('api key', { key });
	// const apiService = await import("$lib/apiService.ts");
	let apiLang = await utils.readApiLang();
	/** @type {string[]} */
	const apiKeyHist = await utils.getKeyHist();

	type TokenInfo = Awaited<ReturnType<typeof apiService.tokenInfo>>;
	type LayoutResult = {
		version: string;
		apiKey: string;
		apiKeyHist: string[];
		apiService: typeof apiService;
		apiLang: string;
		toDoList: Promise<number[]>;
		remindersSettings: ReminderSettings;
		tokenInfo: TokenInfo;
		reminders?: Record<string, string[]>;
	};

	const returnObj: LayoutResult = {
		// @ts-ignore vite define
		version: __VERSION__,
		apiKey: key,
		apiKeyHist,
		apiService,
		apiLang,
		toDoList: utils.readAchievementsToDo(),
		remindersSettings: new ReminderSettings(),
		tokenInfo: apiService.tokenInfo() as TokenInfo,
	};

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
};
