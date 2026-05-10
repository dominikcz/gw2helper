// @ts-nocheck
import { writable } from 'svelte/store';
import utils from '$lib/utils';

function createStore() {
    const { subscribe, set } = writable('en');
    return {
        subscribe,
        async init() {
            const initialLang = await utils.readLang();
            set(initialLang);
        },
        set: ( async (value) => {
            await utils.saveLang(value);
            return set(value);
        })
    }
}

export const lang = createStore()
