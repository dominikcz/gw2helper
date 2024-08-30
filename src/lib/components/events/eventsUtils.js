import { wikiData } from './metas';
import wxdates from '$lib/wxjs_dates';

const et = new Map();
const ignored = ['t', 'dn', 'cdn'];
let dt0;

function init() {
    const _dt0 = new Date();
    _dt0.setHours(_dt0.getHours(), 0, 0, 0);
    dt0 = new Date(_dt0);
    getSchedule(dt0, et, 2);
}

function getSchedule(dt0, et, width) {
    et.clear();
    for (const [key, value] of Object.entries(wikiData)) {
        let category = value['category'] || '';
        if (category) {
            if (!et.has(category)) {
                et.set(category, []);
            }
            let list = et.get(category);
            list.push({
                wikiKey: key,
                name: value.name,
                link: value.link,
                segments: getCurrentWindow(dt0, fillCalendar(value.segments, value.sequences, 25), width, !ignored.includes(key)),
            });
        }
    }
}

function getCurrentWindow(dt0, segments, hours = 2, adjustEventNames = false) {
    const dt1 = wxdates.dateAdd(dt0, 'hours', hours);
    const dt0t = dt0.getTime();
    const dt1t = dt1?.getTime();

    const filtered = segments.filter(
        (x) =>
            (x.start.getTime() >= dt0t && x.stop.getTime() <= dt1t) ||  // ....|dt0...st..sp......|dt1....
            (x.start.getTime() <= dt0t && x.stop.getTime() > dt0t) ||   // .st.|dt0.......sp......|dt1....
            (x.start.getTime() < dt1t && x.stop.getTime() >= dt1t) ||   // ....|dt0.......st......|dt1.sp.
            (x.start.getTime() < dt0t && x.stop.getTime() >= dt1t)      // .st.|dt0...............|dt1.sp.
    );

    filtered.forEach((x) => {
        // for presentation purposes we have to adjust length of segments that start before dt0
        if (x.start.getTime() < dt0t) {
            const diff = wxdates.minutesBetween(x.start, dt0);
            // we keep original start hour in x.start and adjust duration
            x.duration -= diff;
            // and adjust name of the event to indicate that it's continuation
            if (x.name && adjustEventNames) {
                x.name = '...' + x.name;
            }
        }

        // similarly for events that span outside our window
        if (x.stop.getTime() > dt1t) {
            const diff = wxdates.minutesBetween(x.start, dt1);
            // we keep original start hour in x.stop and adjust duration
            x.duration = diff;
        }
    });
    return filtered;
}

function getEventData(ev, duration, time) {
    // console.log('   - evData:', {duration, time});

    let t1 = wxdates.dateAdd(time, 'minutes', duration);
    let t0 = new Date(time);
    time.setTime(t1.getTime());
    return { ...ev, start: t0, stop: t1, duration };
}

function fillCalendar(segments, sequences, hours = 24) {
    const t = new Date();
    t.setUTCHours(0, 0, 0, 0); // reset time part to 00:00:00.000 UTC
    const tmax = wxdates.dateAdd(t, 'hours', hours);
    const sched = [];

    for (const def of sequences.partial) {
        let ev = segments[def.r];
        sched.push(getEventData(ev, def.d, t));
    }
    let i = 0;
    do {
        i++;
        for (const def of sequences.pattern) {
            let ev = segments[def.r];
            sched.push(getEventData(ev, def.d, t));
        }
    } while (t.getTime() < tmax?.getTime() && i < 10 * hours);
    return sched;
}

function getHour(dt) {
    return dt.toLocaleTimeString('pl-PL').slice(0, 5);
}

function getTimeSegments(dt0, hours = 2) {
    let dt = new Date(dt0);
    const sched = [];
    const duration = 15;
    dt.setUTCHours(dt.getUTCHours(), 0, 0, 0);
    for (let i = 0; i < hours * 4; i++) {
        let dt1 = wxdates.dateAdd(dt, 'minutes', duration);
        sched.push({ name: getHour(dt), start: dt, stop: dt1, duration });
        dt = new Date(dt1);
    }
    return sched;
}

function darkerColor(p, c) {
    var i = parseInt,
        r = Math.round,
        [a, b, c, d] = c.split(','),
        P = p < 0,
        t = P ? 0 : 255 * p,
        P = P ? 1 + p : 1 - p;
    return (
        'rgb' + (d ? 'a(' : '(') + r(i(a[3] == 'a' ? a.slice(5) : a.slice(4)) * P + t) + ',' + r(i(b) * P + t) + ',' + r(i(c) * P + t) + (d ? ',' + d : ')')
    );
}

function getColor(colors, darkMode) {
    const output = [];
    const _colors = colors.flat();
    do {
        const color = _colors.splice(0, 3);
        const cstr = `rgb(${color.join(',')})`;
        const c = darkMode ? darkerColor(-0.3, cstr) : cstr;
        output.push(c);
    } while (_colors.length > 0);
    const sout = output.length > 1 ? `linear-gradient(90deg, ${output[0]} 0%, ${output[1]} 100%)` : output[0];
    return sout;
}

function prepareDailyCalendar() {
    const et = new Map();
    const dt = new Date();
    dt.setUTCHours(0, 0, 0, 0);
    getSchedule(dt, et, 32);

    const _allEvents = new Map();
    et.forEach((value, catKey) => {
        value.forEach(group => {
            if (!ignored.includes(group.wikiKey)) {
                group.segments.forEach(event => {
                    const time = getHour(event.start);
                    if (event.name) {
                        if (!_allEvents.has(event.name)) {
                            _allEvents.set(event.name, {
                                name: event.name,
                                bg: event.bg,
                                link: event.link,
                                chatlink: event.chatlink,
                                duration: event.duration,
                                startTimes: [time],
                                category: catKey
                            })
                        }
                        const ev = _allEvents.get(event.name);
                        if (!ev.startTimes.includes(time)) {
                            ev.startTimes.push(time);
                        }
                    }
                })
            }
        })
    });

    // sort start times
    _allEvents.forEach(event => {
        event.startTimes.sort();
        event.next = getNextOccurence(event.startTimes, new Date());
    })
    // convert events to array and group them by category
    return Object.groupBy(Array.from(_allEvents.values()), x => x.category);
}

function getNextOccurence(startTimes, dt) {
    dt = getHour(dt);
    return startTimes.find((x) => x >= dt) || startTimes[0];
}

function getET() {
    return et;
}

function getDt0() {
    return dt0;
}

function excludeEvents(keys) {
    keys.forEach((x) => delete wikiData[x]);
}

function onlyWorldBosses() {
    Object.keys(wikiData).forEach((x) => {
        if (x != 'wb') {
            delete wikiData[x];
        }
    });
}

function getEntries(dt) {
    // param `dt` here is just for cheating responsiveness in svelte. 
    // It's not even required have it declared, but imho it's better read this way, 
    // especially if you jump here from a page that uses this funcion
    return et.entries();
}

export default {
    getColor,
    getTimeSegments,
    getHour,
    getSchedule,
    init,
    getET,
    getEntries,
    excludeEvents,
    wikiData,
    getDt0,
    prepareDailyCalendar,
    getNextOccurence,
    onlyWorldBosses,
}