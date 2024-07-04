import ls from "$lib/wxjs_localstorage";
import { KEY_NAME, KEY_HIST } from "$lib/consts";

function readApiKey() {
    let key = '';
    if (typeof window != 'undefined') {
        key = new URLSearchParams(window.location.search).get('key') || ''
    }
    if (!key) {
        key = ls.get(KEY_NAME, '');
    }
    return key;
}

function saveApiKey(value) {
    const hist = getKeyHist();
    if (!hist.includes(value)) {
        hist.push(value);
        ls.set(KEY_HIST, hist);
    }
    return ls.set(KEY_NAME, value);
}

function deleteApiKey() {
    ls.delete(KEY_NAME)
}

function getKeyHist() {
    return ls.getObject(KEY_HIST, []);
}

export default {
    readApiKey,
    saveApiKey,
    deleteApiKey,
    getKeyHist,
}
