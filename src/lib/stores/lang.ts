import { writable } from 'svelte/store';
import utils from '$lib/utils';

function createStore() {
    const { subscribe, set: setInternal } = writable<string>('en');
    return {
        subscribe,
        async init(): Promise<void> {
            const initialLang = utils.readLang();
            setInternal(initialLang);
        },
        set: async (value: string): Promise<void> => {
            utils.saveLang(value);
            setInternal(value);
        }
    };
}

export const lang = createStore();
