import { browser } from '$app/environment';
import { lang } from '$lib/stores/lang';
import { invalidateAll } from '$app/navigation';
import Llzr, {_} from '$lib/localizer';

let langValue;

export const initi18n = async (defaultLang) => {
	if (browser) {
		langValue = defaultLang;

		lang.subscribe((value) => {
			if (langValue != value) {
				langValue = value;
				Llzr.changeLocale(langValue);
				console.log('switching lang', langValue);
				invalidateAll();
				// loadLocale();	
			}
		});

		Llzr.init({ 
			defaultNamespaces: ['layout', 'common'],
			defaultLocale: langValue,
		});
	}
}

