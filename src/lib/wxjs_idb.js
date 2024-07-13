import wxtypes from '$lib/wxjs_types';

import {get, set, del } from 'idb-keyval';

export default {
    get: async function (key, defValue) {
        let val = await get(key);
        if (val === null && defValue !== undefined) {
            val = defValue;
        }
        return val;
    },
    getObject: async function (key, defValue) {
        let val = (await get(key)) || null;
        if (val === null && defValue !== undefined) {
            val = defValue;
        }
        return val;
    },
    set: async function (key, value) {
        await set(key, value);
    },
    delete: async function (key) {
        await del(key);
    }
}