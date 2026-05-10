import wxtypes from '$lib/wxjs_types';

/** @type {Storage} */
const ls = typeof window != 'undefined' ? window.localStorage : {
    getItem: (_key) => null,
    setItem: (_key, _value) => undefined,
    removeItem: (_key) => undefined,
    clear: () => undefined,
    key: (_index) => null,
    length: 0,
}; 

export default {
    /** @param {string} key @param {string=} defValue */
    get: function(key, defValue){
        let val = ls.getItem(key);
        if (val === null && defValue !== undefined){
            val = defValue;
        }
        return val;
    },
    /** @template T @param {string} key @param {T=} defValue @returns {T | null} */
    getObject: function(key, defValue){
        const raw = ls.getItem(key);
        let val = raw ? JSON.parse(raw) : null;
        if (val === null && defValue !== undefined){
            val = defValue;
        }
        return val;
    },
    /** @param {string} key @param {unknown} value */
    set: function(key, value){
        if (wxtypes.isObjectOrArray(value)){
            value = JSON.stringify(value);
        }
        ls.setItem(key, String(value));
    },
    /** @param {string} key */
    delete: function(key){
        ls.removeItem(key);
    }
}