// from https://webbjocke.com/javascript-check-data-types/

export default {
// Returns if a value is a string
    /** @param {unknown} value */
    isString: (value) => (typeof value === 'string' || value instanceof String),
    
    // Returns if a value is really a number
    /** @param {unknown} value */
    isNumber: (value) => (typeof value === 'number' && isFinite(value)),
    
    // Returns if a value is an array
    /** @param {unknown} value */
    isArray: (value) => Array.isArray(value),
    
    // Returns if a value is a function
    /** @param {unknown} value */
    isFunction: (value) => (typeof value === 'function'),
    
    // Returns if a value is an object
    /** @param {unknown} value */
    isObject: (value) => (value && typeof value === 'object' && value.constructor === Object),

    /** @param {unknown} value */
    isObjectOrArray: (value) => typeof value === 'object',
    
    // Returns if a value is null
    /** @param {unknown} value */
    isNull: (value) => (value === null),
    
    // Returns if a value is undefined
    /** @param {unknown} value */
    isUndefined: (value) => (typeof value === 'undefined'),
    
    // Returns if a value is a boolean
    /** @param {unknown} value */
    isBoolean: (value) => (typeof value === 'boolean'),
    
    // Returns if a value is a regexp
    /** @param {unknown} value */
    isRegExp: (value) => (value && typeof value === 'object' && value.constructor === RegExp),
    
    // Returns if value is an error object
    /** @param {unknown} value */
    isError: (value) => (value instanceof Error && typeof value.message !== 'undefined'), 

    // Returns if value is a date object
    /** @param {unknown} value */
    isDate: (value) => (value instanceof Date),
    
    // Returns if a Symbol
    /** @param {unknown} value */
    isSymbol: (value) => (typeof value === 'symbol')
    
};
