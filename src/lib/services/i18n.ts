import i18n from '@sveltekit-i18n/base';
import parser from '@sveltekit-i18n/parser-icu';

import languages from '$lib/locales/languages.json';
import utils from '$lib/utils';

const namespaces = ['common', 'home', 'layout', 'account', 'achievements', 'characters', 'daily', 'events', 'guilds', 'items', 'materials', 'trading-post', 'legendary'];

const loaders: Array<{ locale: string; key: string; loader: () => Promise<unknown> }> = [];
Object.keys(languages as Record<string, unknown>).forEach((lang) => {
	namespaces.forEach((key) => {
		loaders.push({
			locale: lang,
			key,
			loader: async () => (await import(`./../locales/${lang}/${key}.yaml`)).default
		});
	});
});

export const config = {
	fallbackLocale: 'en',
	parser: parser({ ignoreTag: true }),
	translations: {
		en: { languages },
		pl: { languages }
	},
	loaders
};

type I18nConfig = ConstructorParameters<typeof i18n>[0];
export const { t, loading, locales, locale, loadTranslations, setLocale } = new i18n(config as unknown as I18nConfig);

const isTestEnv = typeof process !== 'undefined' && Boolean(process.env?.VITEST);

locale.subscribe((value) => {
	if (value != undefined) {
		if (!isTestEnv) {
			console.log('locales subscribe', value);
		}
		utils.saveLang(value);
		if (typeof document !== 'undefined') {
			document.documentElement.lang = value;
		}
	}
});

loading.subscribe(($loading) => {
	if ($loading && !isTestEnv) {
		console.log('Loading translations...');
	}
});
