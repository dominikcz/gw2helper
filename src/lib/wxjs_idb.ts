import { get, set, del } from 'idb-keyval';

/**
 * @template T
 * @param {string} key
 * @param {T=} defValue
 * @returns {Promise<T | undefined>}
 */
async function _get<T>(key: string, defValue?: T): Promise<T | undefined> {
    let val = await get(key);
    if (val === undefined && defValue !== undefined) {
        val = defValue;
    }
    return val as T | undefined;
}

type IdbApi = {
    get: {
        <T>(key: string): Promise<T | undefined>;
        <T>(key: string, defValue: T): Promise<T>;
    };
    getObject: {
        <T>(key: string): Promise<T | undefined>;
        <T>(key: string, defValue: T): Promise<T>;
    };
    set: (key: string, value: unknown) => Promise<void>;
    delete: (key: string) => Promise<void>;
};
 
const idbApi: IdbApi = {
    get: _get,
    getObject: _get,
    set: async (key: string, value: unknown) => {
        await set(key, value);
    },
    delete: async (key: string) => {
        await del(key);
    }
};

export default idbApi;