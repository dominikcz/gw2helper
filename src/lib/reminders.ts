import utils from '$lib/utils';
import { writable } from 'svelte/store';
import eventsUtils from './components/events/eventsUtils';

type ReminderMap = Record<string, string[]>;
type ReminderSegment = {
	name: string;
	start: Date;
};

let _reminders: ReminderMap = await utils.readReminders(); // singleton ;)

export default class Reminders {
	private _store;

    constructor() {

        this._store = writable<ReminderMap>(_reminders);
    }

    #save() {
        utils.saveReminders(_reminders);
        this._store.set(_reminders);
    }

    updateAlarms(eventName: string, hours: string[]) {
        _reminders[eventName] = [...hours];
        this.#save();
    }

    addEvent(eventName: string) {
        _reminders[eventName] ??= [];
        this.#save();
    }

    getAlarms(eventName: string): string[] | undefined {
        return _reminders[eventName];
    }

    getAllAlarms(): ReminderMap {
        return _reminders;
    }

    deleteEvent(eventName: string) {
        delete _reminders[eventName];
        this.#save();
    }

    hasEvent(eventName: string): boolean {
        return _reminders[eventName] != undefined;
    }

    hasAny(): boolean {
        return Object.keys(_reminders).length > 0;
    }

    activeAlarms(currTime: Date, inAdvance = 0): string[] {
        const target = eventsUtils.getHour(currTime);
        const test = new Date(currTime);
        const _active: string[] = [];
        Object.keys(_reminders).forEach(event => {
            if (typeof _reminders[event] != "function") {
                const time = _reminders[event].find(x => {
                    const [hRaw, mRaw] = x.split(':');
                    const h = parseInt(hRaw, 10);
                    const m = parseInt(mRaw, 10);
                    test.setHours(h, m, 0, 0);
                    test.setTime(test.getTime() - inAdvance * 60000);
                    const testHour = eventsUtils.getHour(test);
                    const res = (testHour == target);
                    return res;
                })
                if (time) {
                    _active.push(event);
                }
            }
        });

        return _active;
    }

    addReminder(_eventName: string, _hour: string) {

    }

    isWatched(remindersStore: ReminderMap, segment: ReminderSegment): boolean {
        const hour = eventsUtils.getHour(segment.start);
        if (remindersStore[segment.name] != undefined) {
            return remindersStore[segment.name].includes(hour);
        }
        return false;

    }

    get $store() {
        return this._store;
    }

}

