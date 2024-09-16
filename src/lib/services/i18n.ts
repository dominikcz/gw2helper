import { browser } from '$app/environment';
import { init, addMessages, register } from 'svelte-i18n'
import { lang } from '$lib/stores/lang';
import { base } from '$app/paths';

let langValue;
const namespaces = ['layout', 'common'];

lang.subscribe((value) => {
	langValue = value;
	loadLocale();
});

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

function getKeyFromPath(path){
	let key = path.replace(base, '');
	if (key.startsWith('/')){
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
	const localePath = `./../locales/${langValue}/${key}.yaml`;
	console.log('loading locales', localePath);
	return import(/* @vite-ignore */ localePath).then(data => {
		const obj = {};
		obj[key] = data.default;
		addMessages(langValue, obj);
	});
}
