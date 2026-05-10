import wxtypes from '$lib/wxjs_types';

import {get, set, del } from 'idb-keyval';

/**
 * @template T
 * @param {string} key
 * @param {T} defValue
 * @returns {Promise<T>}
 */
async function _get(key, defValue) {
    let val = await get(key);
    if (val === undefined && defValue !== undefined) {
        val = defValue;
    }
    return val;
}
 
export default {
    get: _get,
    getObject: _get,
    /** @param {string} key @param {unknown} value */
    set: async function (key, value) {
        await set(key, value);
    },
    /** @param {string} key */
    delete: async function (key) {
        await del(key);
    }
}