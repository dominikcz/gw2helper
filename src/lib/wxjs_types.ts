// from https://webbjocke.com/javascript-check-data-types/

type PlainObject = Record<string, unknown>;

const wxjsTypes = {
	// Returns if a value is a string
	isString: (value: unknown): value is string | String => typeof value === 'string' || value instanceof String,

	// Returns if a value is really a number
	isNumber: (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value),

	// Returns if a value is an array
	isArray: (value: unknown): value is unknown[] => Array.isArray(value),

	// Returns if a value is a function
	isFunction: (value: unknown): value is (...args: unknown[]) => unknown => typeof value === 'function',

	// Returns if a value is an object
	isObject: (value: unknown): value is PlainObject => Boolean(value) && typeof value === 'object' && (value as object).constructor === Object,

	isObjectOrArray: (value: unknown): value is object | null => typeof value === 'object',

	// Returns if a value is null
	isNull: (value: unknown): value is null => value === null,

	// Returns if a value is undefined
	isUndefined: (value: unknown): value is undefined => typeof value === 'undefined',

	// Returns if a value is a boolean
	isBoolean: (value: unknown): value is boolean => typeof value === 'boolean',

	// Returns if a value is a regexp
	isRegExp: (value: unknown): value is RegExp => Boolean(value) && typeof value === 'object' && (value as object).constructor === RegExp,

	// Returns if value is an error object
	isError: (value: unknown): value is Error => value instanceof Error && typeof value.message !== 'undefined',

	// Returns if value is a date object
	isDate: (value: unknown): value is Date => value instanceof Date,

	// Returns if a Symbol
	isSymbol: (value: unknown): value is symbol => typeof value === 'symbol'
};

export default wxjsTypes;
