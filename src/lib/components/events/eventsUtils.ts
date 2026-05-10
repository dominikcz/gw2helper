import { wikiData } from './metas';
import wxdates from '$lib/wxjs_dates';

type SegmentColor = number[] | number[][] | string;

type SegmentDefinition = {
    name?: string;
    link?: string;
    chatlink?: string;
    bg?: SegmentColor;
};

type SequenceDefinition = {
    r: number;
    d: number;
};

type EventTimerDefinition = {
    category?: string;
    name: string;
    link?: string;
    segments: Record<string, SegmentDefinition>;
    sequences: {
        partial: SequenceDefinition[];
        pattern: SequenceDefinition[];
    };
};

type ScheduledSegment = SegmentDefinition & {
    start: Date;
    stop: Date;
    duration: number;
};

type EventGroup = {
    wikiKey: string;
    name: string;
    link?: string;
    segments: Record<string, ScheduledSegment>;
};

type DailyCalendarEvent = {
    name: string;
    bg?: SegmentColor;
    link?: string;
    chatlink?: string;
    duration: number;
    startTimes: string[];
    category: string;
    next?: string;
};

const eventDefinitions = wikiData as unknown as Record<string, EventTimerDefinition>;
const et = new Map<string, EventGroup[]>();
const ignored = ['t'];
let dt0: Date;

function init() {
    const _dt0 = new Date();
    _dt0.setHours(_dt0.getHours(), 0, 0, 0);
    dt0 = new Date(_dt0);
    getSchedule(dt0, et, 2);
}

function getSchedule(dt0: Date, schedule: Map<string, EventGroup[]>, width: number): void {
    schedule.clear();
    for (const [key, value] of Object.entries(eventDefinitions)) {
        let category = value['category'] || '';
        if (category) {
            if (!schedule.has(category)) {
                schedule.set(category, []);
            }
            const list = schedule.get(category);
            if (!list) continue;
            list.push({
                wikiKey: key,
                name: value.name,
                link: value.link,
                segments: Object.fromEntries(
                    getCurrentWindow(dt0, fillCalendar(value.segments, value.sequences, 25), width, !ignored.includes(key)).map((segment, idx) => [String(idx), segment])
                ),
            });
        }
    }
}

function getCurrentWindow(dt0: Date, segments: ScheduledSegment[], hours = 2, adjustEventNames = false): ScheduledSegment[] {
    const dt1 = wxdates.dateAdd(dt0, 'hours', hours);
    const dt1Safe = dt1 ?? dt0;
    const dt0t = dt0.getTime();
    const dt1t = dt1?.getTime() ?? dt0t;

    const filtered = segments.filter(
        (x) =>
            (x.start.getTime() >= dt0t && x.stop.getTime() <= dt1t) ||  // ....|dt0...st..sp......|dt1....
            (x.start.getTime() <= dt0t && x.stop.getTime() > dt0t) ||   // .st.|dt0.......sp......|dt1....
            (x.start.getTime() < dt1t && x.stop.getTime() >= dt1t) ||   // ....|dt0.......st......|dt1.sp.
            (x.start.getTime() < dt0t && x.stop.getTime() >= dt1t)      // .st.|dt0...............|dt1.sp.
    );

    filtered.forEach((x: ScheduledSegment) => {
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
            const diff = wxdates.minutesBetween(x.start, dt1Safe);
            // we keep original start hour in x.stop and adjust duration
            x.duration = diff;
        }
    });
    return filtered;
}

function getEventData(ev: SegmentDefinition | undefined, duration: number, time: Date): ScheduledSegment {
    // console.log('   - evData:', {duration, time});

    const t1 = wxdates.dateAdd(time, 'minutes', duration) ?? new Date(time);
    let t0 = new Date(time);
    time.setTime(t1.getTime());
    return { ...ev, start: t0, stop: t1, duration };
}

function fillCalendar(segments: Record<string, SegmentDefinition>, sequences: EventTimerDefinition['sequences'], hours = 24): ScheduledSegment[] {
    const t = new Date();
    t.setUTCHours(0, 0, 0, 0); // reset time part to 00:00:00.000 UTC
    const tmax = wxdates.dateAdd(t, 'hours', hours) ?? new Date(t);
    const sched: ScheduledSegment[] = [];

    for (const def of sequences.partial) {
        const ev = segments[String(def.r)];
        sched.push(getEventData(ev, def.d, t));
    }
    let i = 0;
    do {
        i++;
        for (const def of sequences.pattern) {
            const ev = segments[String(def.r)];
            sched.push(getEventData(ev, def.d, t));
        }
    } while (t.getTime() < tmax.getTime() && i < 10 * hours);
    return sched;
}

function getHour(dt: Date): string {
    return dt.toLocaleTimeString('pl-PL').slice(0, 5);
}

function getTimeSegments(dt0: Date, hours = 2): ScheduledSegment[] {
    let dt = new Date(dt0);
    const sched: ScheduledSegment[] = [];
    const duration = 15;
    dt.setUTCHours(dt.getUTCHours(), 0, 0, 0);
    for (let i = 0; i < hours * 4; i++) {
        const dt1 = wxdates.dateAdd(dt, 'minutes', duration) ?? new Date(dt);
        sched.push({ name: getHour(dt), start: dt, stop: dt1, duration });
        dt = new Date(dt1);
    }
    return sched;
}

function darkerColor(p: number, colorValue: string): string {
    const i = parseInt,
        r = Math.round,
        [a, b, c, d] = colorValue.split(','),
        P = p < 0,
        t = P ? 0 : 255 * p,
        P2 = P ? 1 + p : 1 - p;
    return (
        'rgb' + (d ? 'a(' : '(') + r(i(a[3] == 'a' ? a.slice(5) : a.slice(4)) * P2 + t) + ',' + r(i(b) * P2 + t) + ',' + r(i(c) * P2 + t) + (d ? ',' + d : ')')
    );
}

function getColor(colors: SegmentColor | undefined, darkMode: boolean): string {
    if (typeof colors === 'string') {
        return colors;
    }

    const output: string[] = [];
    const _colors = (colors || [0, 0, 0]).flat() as number[];
    do {
        const color = _colors.splice(0, 3);
        const cstr = `rgb(${color.join(',')})`;
        const c = darkMode ? darkerColor(-0.3, cstr) : cstr;
        output.push(c);
    } while (_colors.length > 0);
    const sout = output.length > 1 ? `linear-gradient(90deg, ${output[0]} 0%, ${output[1]} 100%)` : (output[0] || 'rgb(0,0,0)');
    return sout;
}

function prepareDailyCalendar(): Record<string, DailyCalendarEvent[]> {
    const schedule = new Map<string, EventGroup[]>();
    const dt = new Date();
    dt.setUTCHours(0, 0, 0, 0);
    getSchedule(dt, schedule, 32);

    const _allEvents = new Map<string, DailyCalendarEvent>();
    schedule.forEach((value, catKey) => {
        value.forEach((group) => {
            if (!ignored.includes(group.wikiKey)) {
                Object.values(group.segments).forEach((event) => {
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
                            });
                        }
                        const ev = _allEvents.get(event.name);
                        if (ev && !ev.startTimes.includes(time)) {
                            ev.startTimes.push(time);
                        }
                    }
                });
            }
        });
    });

    // sort start times
    _allEvents.forEach((event) => {
        event.startTimes.sort();
        event.next = getNextOccurence(event.startTimes, new Date());
    });

    // convert events to array and group them by category
    return Array.from(_allEvents.values()).reduce((acc, event) => {
        const key = event.category || 'other';
        (acc[key] ||= []).push(event);
        return acc;
    }, {} as Record<string, DailyCalendarEvent[]>);
}

function getNextOccurence(startTimes: string[], dt: Date): string {
    const hour = getHour(dt);
    return startTimes.find((x) => x >= hour) || startTimes[0] || hour;
}

function getET(): Map<string, EventGroup[]> {
    return et;
}

function getDt0(): Date {
    return dt0;
}

function excludeEvents(keys: string[]): void {
    keys.forEach((x) => delete eventDefinitions[x]);
}

function onlyWorldBosses(): void {
    Object.keys(eventDefinitions).forEach((x) => {
        if (x != 'wb') {
            delete eventDefinitions[x];
        }
    });
}

function getEntries(_dt: Date | undefined): IterableIterator<[string, EventGroup[]]> {
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