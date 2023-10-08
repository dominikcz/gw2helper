export const ssr = false;

import utils from "$lib/utils";

export function load() {
	return {
		apiKey: utils.readApiKey(),
	};
}
