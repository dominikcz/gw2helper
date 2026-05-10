const debugMode =
	typeof window != 'undefined'
		? new URLSearchParams(window.location.search).get('debug-mode') == '1'
		: false;

type LoggerApi = {
	debugMode: boolean;
	log: (message: string, params?: unknown) => void;
	error: (message: string, params?: unknown) => void;
	warn: (message: string, params?: unknown) => void;
};

const logger: LoggerApi = {
	debugMode,
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

export default logger;
