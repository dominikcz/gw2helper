const debugMode =
	typeof window != 'undefined'
		? new URLSearchParams(window.location.search).get('debug-mode') == '1'
		: false;

export default {
	debugMode: debugMode,
	log: (message, params) => {
		if (debugMode) {
			console.log(message, params);
		}
	},
	error: (message, params) => {
		console.error(message, params);
	},
	warn: (message, params) => {
		console.warn(message, params);
	},
};
