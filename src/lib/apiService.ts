import Logger from './logger';

const apiUrl = 'https://api.guildwars2.com';

let _apiKey = '';
let fetchOptions = {
	method: 'GET',
	baseURL: apiUrl,
	timeout: 10000,
	expectJson: true,
	onError({ request, error, options }) {
		Logger.error(
			`apiClient response error ${error.code}: ${error.message} \n req: ${JSON.stringify(
				request
			)}, options: ${JSON.stringify(options)}`
		);
	},
	fetchFunction: fetch,
	debug: false
};

const notifyOnError = (req, error, options) => {
	if (fetchOptions.onError) {
		fetchOptions.onError(req, error, options);
	}
};

const apiClient = async (req: string | RequestInfo, query: string, options?: object) => {
	const _options = Object.assign({}, fetchOptions, options);
	if (typeof req == 'string') {
		req = _options.baseURL + req;
	}

	if (_options.debug) {
		Logger.log(`req: ${req}, options: `, _options);
	}
	const response = await _options.fetchFunction(`${req}?access_token=${_apiKey}${query? '&': ''}${query}`, _options);
	if (!response.ok) {
		notifyOnError(req, new Error(`HTTP error, status = ${response.status}`), _options);
	} else {
		let data;
		if (_options.expectJson) {
			data = await response.json();
		} else {
			data = await response.text();
		}
		if (_options.transform) {
			data = _options.transform(data);
		}
		return data;
	}
};

const characters = (options?: object) => {
	return apiClient('/v2/characters', 'ids=all', options);
};

const init = (apiKey: string, options?: object) => {
	Logger.log('init', apiKey);
	_apiKey = apiKey;
	fetchOptions = Object.assign({}, fetchOptions, options);
};

export default {
	init,
	characters
};
