import { writable } from 'svelte/store';
import utils from '$lib/utils';

function createStore() {
    const { subscribe, set } = writable('en');
    return {
        subscribe,
        init() {
            const initialLang = utils.readLang();
            set(initialLang);
        },
        set: ((value) => {
            utils.saveLang(value);
            return set(value);
        })
    }
}

export const lang = createStore()
