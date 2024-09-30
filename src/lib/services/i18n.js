import i18n from '@sveltekit-i18n/base';
import parser from '@sveltekit-i18n/parser-icu';

import languages from '$lib/locales/languages.json';

const namespaces = ['common', 'home', 'layout', 'account', 'achievements', 'characters', 'daily', 'events', 'guilds', 'items', 'materials'];

const loaders = [];
Object.keys(languages).forEach((lang) => {
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
	parser: parser({ignoreTag: true}),	
	translations: {
		en: { languages },
		pl: { languages }
	},
	loaders
};

export const { t, loading, locales, locale, loadTranslations, setLocale } = new i18n(config);

loading.subscribe(($loading) => $loading && console.log('Loading translations...'));
