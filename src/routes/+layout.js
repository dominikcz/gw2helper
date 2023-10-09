export const ssr = false;

import utils from "$lib/utils";
import apiService from "$lib/apiService.ts";

export function load( { fetch } ) {
	const key = utils.readApiKey();
	apiService.init(key, {fetchFunction: fetch });
	return {
		apiKey: key,
		'apiService': apiService,
	};
}
