const debugMode =
	typeof window != 'undefined'
		? new URLSearchParams(window.location.search).get('debug-mode') == '1'
		: false;

export default {
	debugMode: debugMode,
	/** @param {string} message @param {unknown=} params */
	log: (message, params) => {
		if (debugMode) {
			console.log(message, params);
		}
	},
	/** @param {string} message @param {unknown=} params */
	error: (message, params) => {
		console.error(message, params);
	},
	/** @param {string} message @param {unknown=} params */
	warn: (message, params) => {
		console.warn(message, params);
	},
};
