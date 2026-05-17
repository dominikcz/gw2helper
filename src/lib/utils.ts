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

export type WalletSettings = { showDepreciated?: boolean };
export type EventTimerSettings = {
    showChatLinks?: boolean;
    showEventTimes?: boolean;
    showCategories?: boolean;
    showHeadings?: boolean;
    autoScroll?: boolean;
};
export type AchievementSettings = {
    notCompleted?: boolean;
    withPoints?: boolean;
    withMasteryCentral?: boolean;
    withMasteryHoT?: boolean;
    withMasteryPoF?: boolean;
    withMasteryIce?: boolean;
    withMasteryEoD?: boolean;
    withMasterySofO?: boolean;
    withMasteryJW?: boolean;
    withTitles?: boolean;
    withItems?: boolean;
    withCoins?: boolean;
    daily?: boolean;
    weekly?: boolean;
    sortBy?: string;
};
export type ReminderSettings = { inAdvance?: number; sound?: string; sortBy?: string };

type NumericLike = number | `${number}` | null | undefined;

async function readApiKey(): Promise<string> {
    let key = '';
    if (typeof window !== 'undefined') {
        key = new URLSearchParams(window.location.search).get('key') ?? '';
    }
    if (!key) {
        key = await idb.get<string>(KEY_NAME, '');
    }
    return key;
}

async function saveApiKey(value: string): Promise<void> {
    const hist = await getKeyHist();
    if (!hist.includes(value)) {
        hist.push(value);
        await idb.set(KEY_HIST, hist);
    }
    await idb.set(KEY_NAME, value);
}

async function deleteApiKey(): Promise<void> {
    await idb.delete(KEY_NAME);
}

async function getKeyHist(): Promise<string[]> {
    return await idb.getObject<string[]>(KEY_HIST, []);
}

async function readApiLang(): Promise<string> {
    return await idb.get<string>(API_LANG, 'en');
}

async function saveApiLang(value: string): Promise<void> {
    await idb.set(API_LANG, value);
}

function readLang(defaultValue = 'en'): string {
    return ls.get(LANG, defaultValue) ?? defaultValue;
}

function saveLang(value: string): void {
    ls.set(LANG, value);
}

async function readEventTimerSettings(): Promise<EventTimerSettings> {
    return await idb.getObject<EventTimerSettings>(EVENT_TIMER_SETTINGS, {});
}

async function saveEventTimerSettings(settings: Record<string, unknown>): Promise<void> {
    await idb.set(EVENT_TIMER_SETTINGS, settings);
}

async function readEventTimerCategories(): Promise<Record<string, unknown>> {
    return await idb.getObject<Record<string, unknown>>(EVENT_TIMER_CATEGORIES, {});
}

async function saveEventTimerCategories(settings: Record<string, unknown>): Promise<void> {
    await idb.set(EVENT_TIMER_CATEGORIES, settings);
}

async function readAchievementsSettings(): Promise<AchievementSettings> {
    return await idb.getObject<AchievementSettings>(ACHIEVEMENTS_SETTINGS, {});
}

async function saveAchievementsSettings(settings: Record<string, unknown>): Promise<void> {
    await idb.set(ACHIEVEMENTS_SETTINGS, settings);
}

async function readWalletSettings(): Promise<WalletSettings> {
    return await idb.getObject<WalletSettings>(WALLET_SETTINGS, {});
}

async function saveWalletSettings(settings: Record<string, unknown>): Promise<void> {
    await idb.set(WALLET_SETTINGS, settings);
}

export function sum<T extends Record<string, unknown>>(array: T[], property: keyof T & string): number {
    return array.reduce((acc, curr) => {
        const raw = curr[property] as NumericLike;
        const parsed = typeof raw === 'number' ? raw : Number(raw ?? 0);
        return acc + (Number.isFinite(parsed) ? parsed : 0);
    }, 0);
}

export function sumGroupBy<T extends Record<string, unknown>>(
    array: T[],
    groupingKeys: Array<keyof T & string>,
    sumProperty: keyof T & string
): T[] {
    const cache = array.reduce<Record<string, T>>((acc, curr) => {
        const key = groupingKeys.map((x) => String(curr[x] ?? '')).join('-');
        if (acc[key]) {
            const current = Number((acc[key][sumProperty] as NumericLike) ?? 0);
            const extra = Number((curr[sumProperty] as NumericLike) ?? 0);
            const value = (Number.isFinite(current) ? current : 0) + (Number.isFinite(extra) ? extra : 0);
            acc[key][sumProperty] = value as unknown as T[typeof sumProperty];
        } else {
            acc[key] = { ...curr };
        }
        return acc;
    }, {});

    return Object.values(cache);
}

async function saveAchievementsToDo(list: number[]): Promise<void> {
    await idb.set(ACHIEVEMENTS_TODO, list);
}

async function saveWatchedEvents(list: string[]): Promise<void> {
    await idb.set(WATCHED_EVENTS, list);
}

async function saveReminders(value: Record<string, string[]>): Promise<void> {
    await idb.set(REMINDERS, value);
}

async function saveRemindersSettings(value: Record<string, unknown>): Promise<void> {
    await idb.set(REMINDERS_SETTINGS, value);
}

async function readWatchedEvents(): Promise<string[]> {
    return await idb.getObject<string[]>(WATCHED_EVENTS, []);
}

async function readReminders(): Promise<Record<string, string[]>> {
    return await idb.getObject<Record<string, string[]>>(REMINDERS, {});
}

async function readRemindersSettings(): Promise<ReminderSettings> {
    return await idb.getObject<ReminderSettings>(REMINDERS_SETTINGS, {});
}

async function readAchievementsToDo(): Promise<number[]> {
    return await idb.getObject<number[]>(ACHIEVEMENTS_TODO, []);
}

async function readWalletOrder(): Promise<number[]> {
    return await idb.getObject<number[]>(WALLET_ORDER, []);
}

async function saveWalletOrder(value: number[]): Promise<void> {
    await idb.set(WALLET_ORDER, value);
}

export function getQueryString(keyName: string, defaultValue?: string): string | undefined {
    if (typeof window !== 'undefined') {
        const query = new URLSearchParams(window.location.search).get(keyName);
        return query === null ? defaultValue : query;
    }
    return defaultValue;
}

export function getQueryStringFlag(keyName: string): boolean {
    return getQueryString(keyName) === '1';
}

export function runsDesktop(): boolean {
    if (typeof window === 'undefined') {
        return true;
    }
    const browser = window.navigator.userAgent || '';
    const desktop = ['Windows', 'Linux', 'Macintosh'].some((v) => browser.includes(v));
    console.log('desktop', desktop);
    return desktop;
}

type TodoToggleEvent = { id: number; todo: boolean };

export async function hndToggleTodo(event: TodoToggleEvent, todoList: number[]): Promise<void> {
    if (event.todo) {
        if (!todoList.includes(event.id)) {
            todoList.push(event.id);
        }
    } else {
        let index = todoList.indexOf(event.id);
        while (index >= 0) {
            todoList.splice(index, 1);
            index = todoList.indexOf(event.id);
        }
    }

    await saveAchievementsToDo([...todoList]);
}

const utils = {
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
    hndToggleTodo
};

export default utils;
