// from https://webbjocke.com/javascript-check-data-types/

export default {
// Returns if a value is a string
    isString: (value) => (typeof value === 'string' || value instanceof String),
    
    // Returns if a value is really a number
    isNumber: (value) => (typeof value === 'number' && isFinite(value)),
    
    // Returns if a value is an array
    isArray: (value) => Array.isArray(value),
    
    // Returns if a value is a function
    isFunction: (value) => (typeof value === 'function'),
    
    // Returns if a value is an object
    isObject: (value) => (value && typeof value === 'object' && value.constructor === Object),

    isObjectOrArray: (value) => typeof value === 'object',
    
    // Returns if a value is null
    isNull: (value) => (value === null),
    
    // Returns if a value is undefined
    isUndefined: (value) => (typeof value === 'undefined'),
    
    // Returns if a value is a boolean
    isBoolean: (value) => (typeof value === 'boolean'),
    
    // Returns if a value is a regexp
    isRegExp: (value) => (value && typeof value === 'object' && value.constructor === RegExp),
    
    // Returns if value is an error object
    isError: (value) => (value instanceof Error && typeof value.message !== 'undefined'), 

    // Returns if value is a date object
    isDate: (value) => (value instanceof Date),
    
    // Returns if a Symbol
    isSymbol: (value) => (typeof value === 'symbol')
    
};
