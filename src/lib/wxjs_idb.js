import wxtypes from '$lib/wxjs_types';

import {get, set, del } from 'idb-keyval';

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
    set: async function (key, value) {
        await set(key, value);
    },
    delete: async function (key) {
        await del(key);
    }
}