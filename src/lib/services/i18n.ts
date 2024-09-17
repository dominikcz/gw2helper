import { browser } from '$app/environment';
import { init, addMessages } from 'svelte-i18n'
import { lang } from '$lib/stores/lang';
import { base } from '$app/paths';

let langValue;
let namespacesCache = [];
const namespaces = ['layout', 'common'];

export const initi18n = () => {
	if (browser) {
		lang.subscribe(async (value) => {
			langValue = value;
			namespacesCache = [];
			console.log('switching lang', langValue);
			loadLocale();
		});
	}
}

async function loadLocale() {
	if (browser) {
		const tasks = [];

		namespaces.forEach((key) => {
			tasks.push(loadLocaleForPath(key));
		});

		tasks.push(loadLocaleForPath(window.location.pathname));

		await Promise.all(tasks);

		init({
			fallbackLocale: 'en',
			initialLocale: langValue,
		})
	}
}

function getKeyFromPath(path) {
	let key = path.replace(base, '');
	if (key.startsWith('/')) {
		key = key.slice(1);
	}
	if (key.endsWith('/')) {
		key = key.slice(0, key.length - 1)
	}
	if (key == '') {
		key = 'home'
	}
	return key;
}

export async function loadLocaleForPath(path) {
	const key = getKeyFromPath(path);

	if (!namespacesCache.includes(key)) {
		const localePath = `./../locales/${langValue}/${key}.yaml`;
		console.log('loading locales', localePath);
		return import(/* @vite-ignore */ localePath).then(data => {
			const obj = {};
			obj[key] = data.default;
			addMessages(langValue, obj);
			namespacesCache.push(key);
		});
	}
}
