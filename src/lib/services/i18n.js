import { browser } from '$app/environment';
import Llzr, {_} from '$lib/localizer';

export const initi18n = async (defaultLang) => {
	if (browser) {
		const options = {
			defaultNamespaces: ['layout', 'common'],
		};

		if (defaultLang) {
			options.defaultLocale = defaultLang;
		}

		await Llzr.init(options);
	}
}

