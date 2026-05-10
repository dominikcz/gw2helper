// @ts-nocheck
import idb from "$lib/wxjs_idb";
import ls from "$lib/wxjs_localstorage";

import {
    KEY_NAME,
    KEY_HIST,
    EVENT_TIMER_SETTINGS,
    EVENT_TIMER_CATEGORIES,
    ACHIEVEMENTS_SETTINGS,
    ACHIEVEMENTS_TODO,
    WALLET_SETTINGS,
    WATCHED_EVENTS,
    REMINDERS,
    REMINDERS_SETTINGS,
    WALLET_ORDER,
    API_LANG,
    LANG
} from "$lib/consts";

/** @typedef {{ showDepreciated?: boolean }} WalletSettings */
/** @typedef {{ showChatLinks?: boolean, showEventTimes?: boolean, showCategories?: boolean, showHeadings?: boolean, autoScroll?: boolean }} EventTimerSettings */
/** @typedef {{ notCompleted?: boolean, withPoints?: boolean, withMasteryCentral?: boolean, withMasteryHoT?: boolean, withMasteryPoF?: boolean, withMasteryIce?: boolean, withMasteryEoD?: boolean, withMasterySofO?: boolean, withMasteryJW?: boolean, withTitles?: boolean, withItems?: boolean, withCoins?: boolean, daily?: boolean, weekly?: boolean, sortBy?: string }} AchievementSettings */
/** @typedef {{ inAdvance?: number, sound?: string, sortBy?: string }} ReminderSettings */

type WalletSettings = { showDepreciated?: boolean };
type EventTimerSettings = { showChatLinks?: boolean; showEventTimes?: boolean; showCategories?: boolean; showHeadings?: boolean; autoScroll?: boolean };
type AchievementSettings = { notCompleted?: boolean; withPoints?: boolean; withMasteryCentral?: boolean; withMasteryHoT?: boolean; withMasteryPoF?: boolean; withMasteryIce?: boolean; withMasteryEoD?: boolean; withMasterySofO?: boolean; withMasteryJW?: boolean; withTitles?: boolean; withItems?: boolean; withCoins?: boolean; daily?: boolean; weekly?: boolean; sortBy?: string };
type ReminderSettings = { inAdvance?: number; sound?: string; sortBy?: string };

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

/** @param {string} value */
async function saveApiKey(value) {
    /** @type {string[]} */
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
    /** @type {string[]} */
    return await idb.getObject(KEY_HIST, []);
}

async function readApiLang() {
    return await idb.get(API_LANG, 'en');
}

/** @param {string} value */
async function saveApiLang(value) {
    return await idb.set(API_LANG, value);
}

function readLang(defaultValue = 'en') {
    return ls.get(LANG, defaultValue);
}

/** @param {string} value */
function saveLang(value) {
    return ls.set(LANG, value);
}

/** @returns {Promise<EventTimerSettings>} */
async function readEventTimerSettings(): Promise<EventTimerSettings> {
    return await idb.getObject<EventTimerSettings>(EVENT_TIMER_SETTINGS, {} as EventTimerSettings);
}

/** @param {Record<string, unknown>} settings */
async function saveEventTimerSettings(settings) {
    return await idb.set(EVENT_TIMER_SETTINGS, settings);
}

/** @returns {Promise<Record<string, unknown>>} */
async function readEventTimerCategories() {
    /** @type {Record<string, unknown>} */
    return await idb.getObject(EVENT_TIMER_CATEGORIES, {});
}

/** @param {Record<string, unknown>} settings */
async function saveEventTimerCategories(settings) {
    return await idb.set(EVENT_TIMER_CATEGORIES, settings);
}

/** @returns {Promise<AchievementSettings>} */
async function readAchievementsSettings(): Promise<AchievementSettings> {
    return await idb.getObject<AchievementSettings>(ACHIEVEMENTS_SETTINGS, {} as AchievementSettings);
}

/** @param {Record<string, unknown>} settings */
async function saveAchievementsSettings(settings) {
    return await idb.set(ACHIEVEMENTS_SETTINGS, settings);
}

/** @returns {Promise<WalletSettings>} */
async function readWalletSettings(): Promise<WalletSettings> {
    return await idb.getObject<WalletSettings>(WALLET_SETTINGS, {} as WalletSettings);
}

/** @param {Record<string, unknown>} settings */
async function saveWalletSettings(settings) {
    return await idb.set(WALLET_SETTINGS, settings);
}

/** @param {Array<Record<string, any>>} array @param {string} property */
export function sum(array, property) {
    return array.reduce((acc, curr) => acc + (curr[property] || 0), 0)
}

/** @param {Array<Record<string, any>>} array @param {string[]} groupingKeys @param {string} sumProperty */
export function sumGroupBy(array, groupingKeys, sumProperty) {
    const cache = array.reduce((acc, curr) => {
        const key = groupingKeys.map(x => curr[x]).join('-');
        if (acc[key]) { acc[key][sumProperty] += curr[sumProperty]; }
        else {
            acc[key] = { ...curr };
        }
        return acc;
    }, /** @type {Record<string, Record<string, any>>} */ ({}));
    return Object.values(cache);
}

/** @param {number[]} list */
async function saveAchievementsToDo(list) {
    return await idb.set(ACHIEVEMENTS_TODO, list);
}

/** @param {string[]} list */
async function saveWatchedEvents(list) {
    return await idb.set(WATCHED_EVENTS, list);
}

/** @param {Record<string, string[]>} value */
async function saveReminders(value) {
    return await idb.set(REMINDERS, value);
}

/** @param {Record<string, unknown>} value */
async function saveRemindersSettings(value) {
    return await idb.set(REMINDERS_SETTINGS, value);
}

async function readWatchedEvents() {
    /** @type {string[]} */
    return await idb.getObject(WATCHED_EVENTS, []);
}

async function readReminders() {
    /** @type {Record<string, string[]>} */
    return await idb.getObject(REMINDERS, {});
}

/** @returns {Promise<ReminderSettings>} */
async function readRemindersSettings(): Promise<ReminderSettings> {
    return await idb.getObject<ReminderSettings>(REMINDERS_SETTINGS, {} as ReminderSettings);
}

async function readAchievementsToDo() {
    /** @type {number[]} */
    return await idb.getObject(ACHIEVEMENTS_TODO, []);
}

async function readWalletOrder() {
    /** @type {number[]} */
    return await idb.getObject(WALLET_ORDER, []);
}

/** @param {number[]} value */
async function saveWalletOrder(value) {
    return await idb.set(WALLET_ORDER, value);
}

/** @param {string} keyName @param {string=} defaultValue */
export function getQueryString(keyName, defaultValue) {
    if (typeof window != 'undefined') {
        const query = new URLSearchParams(window.location.search).get(keyName);
        return (query === null) ? defaultValue : query;
    }
    return defaultValue;
}

/** @param {string} keyName */
export function getQueryStringFlag(keyName) {
    return getQueryString(keyName) == '1' ? true : false;
}

export function runsDesktop() {
    const browser = window.navigator.userAgent || '';
    const desktop = ['Windows', 'Linux', 'Macintosh'].some((v) => browser.includes(v));
    console.log('desktop', desktop);
    return desktop;
}

/** @param {{ id: number, todo: boolean }} event @param {number[]} todoList */
export async function hndToggleTodo(event, todoList) {
    // console.log('hndToggleTodo', {event, todoList})
    if (event.todo) {
        todoList.push(event.id);
    } else {
        const index = todoList.indexOf(event.id);
        const x = todoList.splice(index, 1);
        //DC: filter breaks reactivity :(
        // todoList.re = todoList.filter((x) => x !== event.id);
    }
    const clone = [...todoList];
    // console.log('saveAchievementsToDo', clone);
    await saveAchievementsToDo(clone);
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
    readEventTimerCategories,
    saveEventTimerCategories,
    readAchievementsSettings,
    saveAchievementsSettings,
    readAchievementsToDo,
    saveAchievementsToDo,
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
    hndToggleTodo,
}
