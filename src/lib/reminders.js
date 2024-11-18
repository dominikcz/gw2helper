import utils from '$lib/utils';
import { writable } from 'svelte/store';
import eventsUtils from './components/events/eventsUtils';

let _reminders = await utils.readReminders(); // singleton ;)

export default class Reminders {

    constructor() {

        this._store = writable(_reminders);
    }

    #save() {
        utils.saveReminders(_reminders);
        this._store.set(_reminders);
    }

    updateAlarms(eventName, hours) {
        _reminders[eventName] = [...hours];
        this.#save();
    }

    addEvent(eventName) {
        _reminders[eventName] ??= [];
        this.#save();
    }

    getAlarms(eventName) {
        return _reminders[eventName];
    }

    deleteEvent(eventName) {
        delete _reminders[eventName];
        this.#save();
    }

    hasEvent(eventName) {
        return _reminders[eventName] != undefined;
    }

    hasAny() {
        return Object.keys(_reminders).length > 0;
    }

    activeAlarms(currTime, inAdvance = 0) {
        const target = eventsUtils.getHour(currTime);
        const test = new Date(currTime);
        const _active = [];
        Object.keys(_reminders).forEach(event => {
            if (typeof _reminders[event] != "function") {
                const time = _reminders[event].find(x => {
                    let [h, m] = x.split(':');
                    h = parseInt(h);
                    m = parseInt(m);
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

    addReminder(eventName, hour) {

    }

    isWatched(remindersStore, segment) {
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

