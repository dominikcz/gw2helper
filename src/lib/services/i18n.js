import { browser } from '$app/environment';
import { init, addMessages } from 'svelte-i18n'
import { lang } from '$lib/stores/lang';
import { base } from '$app/paths';
import { invalidateAll } from '$app/navigation';

let langValue;
let namespacesCache = [];
const namespaces = ['layout', 'common'];

export const initi18n = async (defaultLang) => {
	if (browser) {
		langValue = defaultLang;
		await loadLocale();

		lang.subscribe((value) => {
			if (langValue != value) {
				langValue = value;
				namespacesCache = [];
				console.log('switching lang', langValue);
				invalidateAll();
				// loadLocale();	
			}
		});
	}
}

async function importLocale(path) {
	return fetch(path)
		.then((response) => response.json());
}

export async function loadLocale(path = window.location.pathname) {
	if (browser) {
		const keys = getLocalePaths(path);
		const tasks = [];

		keys.forEach(key => {
			if (key) {
				// tasks.push(import(/* @vite-ignore */ key.path, { with: { type: "json" } }).then(data => {
				tasks.push(importLocale(key.path).then(data => {
					const obj = {};
					obj[key.id] = data;
					addMessages(langValue, obj);
					namespacesCache.push(key.id);
					console.log('loaded locale', key.id, key.path)
				}));
			}
		})

		await Promise.all(tasks);
		console.log('locale finished')

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

// export async function loadLocaleForPath(path) {
// 	const key = getKeyFromPath(path);

// 	if (!namespacesCache.includes(key)) {
// 		const localePath = `./../locales/${langValue}/${key}.json`;
// 		console.log('loading locales', localePath);
// 		return import(/* @vite-ignore */ localePath).then(data => {
// 			const obj = {};
// 			obj[key] = data.default;
// 			addMessages(langValue, obj);
// 			namespacesCache.push(key);
// 		});
// 	}
// }

function getLocalePaths(path) {
	const keys = [];
	const key = getKeyFromPath(path);
	const test = [...namespaces, key];

	test.forEach((key) => {
		if (!namespacesCache.includes(key)) {
			keys.push({ id: key, path: `${base}/locales/${langValue}/${key}.json` });
		}
	});
	return keys;
}
