import idb from "$lib/wxjs_idb";
import ls from "$lib/wxjs_localstorage";

import { 
    KEY_NAME, 
    KEY_HIST, 
    EVENT_TIMER_SETTINGS, 
    ACHIEVES_SETTINGS, 
    ACHIEVES_TODO, 
    WALLET_SETTINGS, 
    WATCHED_EVENTS, 
    REMINDERS, 
    REMINDERS_SETTINGS, 
    WALLET_ORDER, 
    API_LANG, 
    LANG 
} from "$lib/consts";

async function readApiKey() {
    let key = '';
    if (typeof window != 'undefined') {
        key = new URLSearchParams(window.location.search).get('key') || ''
    }
    if (!key) {
        key = await idb.get(KEY_NAME, '');
    }
    return key;
}

async function saveApiKey(value) {
    const hist = await getKeyHist();
    if (!hist.includes(value)) {
        hist.push(value);
        await idb.set(KEY_HIST, hist);
    }
    return await idb.set(KEY_NAME, value);
}

async function deleteApiKey() {
    await idb.delete(KEY_NAME)
}

async function getKeyHist() {
    return await idb.getObject(KEY_HIST, []);
}

async function readApiLang() {
    return await idb.get(API_LANG, 'en');
}

async function saveApiLang(value) {
    return await idb.set(API_LANG, value);
}

function readLang(defaultValue = 'en') {
    return ls.get(LANG, defaultValue);
}

function saveLang(value) {
    return ls.set(LANG, value);
}

async function readEventTimerSettings() {
    return await idb.getObject(EVENT_TIMER_SETTINGS, {});
}

async function saveEventTimerSettings(settings) {
    return await idb.set(EVENT_TIMER_SETTINGS, settings);
}

async function readAchievesSettings() {
    return await idb.getObject(ACHIEVES_SETTINGS, {});
}

async function saveAchievesSettings(settings) {
    return await idb.set(ACHIEVES_SETTINGS, settings);
}

async function readWalletSettings() {
    return await idb.getObject(WALLET_SETTINGS, {});
}

async function saveWalletSettings(settings) {
    return await idb.set(WALLET_SETTINGS, settings);
}

export function sum(array, property) {
    return array.reduce((acc, cur) => acc + cur[property], 0)
}

async function saveAchievesToDo(list) {
    return await idb.set(ACHIEVES_TODO, list);
}

async function saveWatchedEvents(list) {
    return await idb.set(WATCHED_EVENTS, list);
}

async function saveReminders(value) {
    return await idb.set(REMINDERS, value);
}

async function saveRemindersSettings(value) {
    return await idb.set(REMINDERS_SETTINGS, value);
}

async function readWatchedEvents() {
    return await idb.getObject(WATCHED_EVENTS, []);
}

async function readReminders() {
    return await idb.getObject(REMINDERS, {});
}

async function readRemindersSettings() {
    return await idb.getObject(REMINDERS_SETTINGS, {});
}

async function readAchievesToDo() {
    return await idb.getObject(ACHIEVES_TODO, []);
}

async function readWalletOrder() {
    return await idb.getObject(WALLET_ORDER, []);
}

async function saveWalletOrder(value) {
    return await idb.set(WALLET_ORDER, value);
}

export function getQueryString(keyName, defaultValue) {
    if (typeof window != 'undefined') {
        const query = new URLSearchParams(window.location.search).get(keyName);
        return (query === null) ? defaultValue : query;
    }
    return defaultValue;
}

export function getQueryStringFlag(keyName) {
    return getQueryString(keyName) == '1' ? true : false;
}

export function runsDesktop() {
    const browser = window.navigator.userAgent || window.opera;
    const desktop = ['Windows', 'Linux', 'Macintosh'].some((v) => browser.includes(v));
    console.log('desktop', desktop);
    return desktop;
}

export default {
    readApiKey,
    saveApiKey,
    readLang,
    saveLang,
    readApiLang,
    saveApiLang,
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
    readWatchedEvents,
    saveWatchedEvents,
    readReminders,
    saveReminders,
    readRemindersSettings,
    saveRemindersSettings,
    readWalletOrder,
    saveWalletOrder,
    getQueryString,
    getQueryStringFlag,
    runsDesktop,
}
