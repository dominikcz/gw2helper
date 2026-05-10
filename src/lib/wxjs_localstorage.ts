import wxtypes from '$lib/wxjs_types';

const ls: Storage = typeof window != 'undefined'
    ? window.localStorage
    : {
        getItem: (_key: string) => null,
        setItem: (_key: string, _value: string) => undefined,
        removeItem: (_key: string) => undefined,
        clear: () => undefined,
        key: (_index: number) => null,
        length: 0
    };

type LocalStorageApi = {
    get: (key: string, defValue?: string) => string | null;
    getObject: <T>(key: string, defValue?: T) => T | null;
    set: (key: string, value: unknown) => void;
    delete: (key: string) => void;
};

const localstorageApi: LocalStorageApi = {
    get(key: string, defValue?: string) {
        let val = ls.getItem(key);
        if (val === null && defValue !== undefined) {
            val = defValue;
        }
        return val;
    },
    getObject<T>(key: string, defValue?: T): T | null {
        const raw = ls.getItem(key);
        let val = raw ? (JSON.parse(raw) as T) : null;
        if (val === null && defValue !== undefined) {
            val = defValue;
        }
        return val;
    },
    set(key: string, value: unknown): void {
        if (wxtypes.isObjectOrArray(value)) {
            value = JSON.stringify(value);
        }
        ls.setItem(key, String(value));
    },
    delete(key: string): void {
        ls.removeItem(key);
    }
};

export default localstorageApi;