import ls from "$lib/wxjs_idb";
import { KEY_NAME, KEY_HIST, EVENT_TIMER_SETTINGS, ACHIEVES_SETTINGS, ACHIEVES_TODO, WALLET_SETTINGS, WATCHED_EVENTS } from "$lib/consts";

async function readApiKey() {
    let key = '';
    if (typeof window != 'undefined') {
        key = new URLSearchParams(window.location.search).get('key') || ''
    }
    if (!key) {
        key = ls.get(KEY_NAME, '');
    }
    return key;
}

async function saveApiKey(value) {
    const hist = await getKeyHist();
    if (!hist.includes(value)) {
        hist.push(value);
        await ls.set(KEY_HIST, hist);
    }
    return await ls.set(KEY_NAME, value);
}

async function deleteApiKey() {
    await ls.delete(KEY_NAME)
}

async function getKeyHist() {
    return await ls.getObject(KEY_HIST, []);
}

async function readEventTimerSettings(){
    return await ls.getObject(EVENT_TIMER_SETTINGS, {});
}

async function saveEventTimerSettings(settings){
    return await ls.set(EVENT_TIMER_SETTINGS, settings);
}

async function readAchievesSettings(){
    return await ls.getObject(ACHIEVES_SETTINGS, {});
}

async function saveAchievesSettings(settings){
    return await ls.set(ACHIEVES_SETTINGS, settings);
}

async function readWalletSettings(){
    return await ls.getObject(WALLET_SETTINGS, {});
}

async function saveWalletSettings(settings){
    return await ls.set(WALLET_SETTINGS, settings);
}

export function sum(array, property) {
    return array.reduce((acc, cur) => acc + cur[property], 0)
}

async function saveAchievesToDo(list){
    return ls.set(ACHIEVES_TODO, list);
}

async function saveWatchedEvents(list){
    return ls.set(WATCHED_EVENTS, list);
}

async function readAchievesToDo(){
    return await ls.getObject(ACHIEVES_TODO, []);
}

function getQueryString(keyName, defaultValue){
    if (typeof window != 'undefined'){
        const query = new URLSearchParams(window.location.search).get(keyName);
        return (query === null) ? defaultValue : query;
    }
    return defaultValue;
}

function getQueryStringFlag(keyName){
    return getQueryString(keyName) == '1' ? true : false;
}

export default {
    readApiKey,
    saveApiKey,
    deleteApiKey,
    getKeyHist,
    readEventTimerSettings,
    saveEventTimerSettings,
    readAchievesSettings,
    saveAchievesSettings,
    readAchievesToDo,
    saveAchievesToDo,
    readWalletSettings,
    saveWalletSettings,
    saveWatchedEvents,
    getQueryString,
    getQueryStringFlag,
}
