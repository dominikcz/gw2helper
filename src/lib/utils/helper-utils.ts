import wxjs_types from "$lib/wxjs_types";

export type FilterOptions = {
    nonZero?: boolean,
    nonZeroField?: string,
}

const DEFAULT_FILTER_OPTIONS: FilterOptions = {
    nonZero: false,
    nonZeroField: 'count',
}

type AnyRecord = Record<string, unknown> & {
    count?: number;
};

function match(word: string, obj: AnyRecord, properties: Array<string>) {
    // at least one property has to match
    return properties.some((x) => {
        const count = obj.count;
        if (count != undefined && ['>', '<', '='].includes(word.charAt(0))) {
            if (word.startsWith('=')) {
                return count ? count == parseInt(word.slice(1)) : false;
            } else if (word.startsWith('>=')) {
                return count ? count >= parseInt(word.slice(2)) : false;
            } else if (word.startsWith('>')) {
                return count ? count > parseInt(word.slice(1)) : false;
            } else if (word.startsWith('<=')) {
                return count ? count <= parseInt(word.slice(2)) : false;
            } else if (word.startsWith('<')) {
                return count ? count < parseInt(word.slice(1)) : false;
            }
        } else {
            const value = obj[x];
            const t = typeof value;
            if (t === 'string' && (value as string).toLowerCase().includes(word)) {
                return true;
            }
            if (t === 'number' && ('' + value).includes(word)) {
                return true;
            }
            if (Array.isArray(value) && value.join(',').toLowerCase().includes(word)) {
                return true;
            }
        }
        return false;
    });
}

function fullTextSearch(filter: string, obj: AnyRecord, properties: Array<string>) {
    if (!filter) return true;
    const f = filter.toLowerCase();

    const words = f.split(' ');
    // all words have to be found somewhere
    return words.every((x) => match(x, obj, properties));
}

function filterCollection<T extends AnyRecord>(collection: Array<T>, fields: Array<string>, filter: string, options: FilterOptions = DEFAULT_FILTER_OPTIONS): Array<T> {
    const nonZeroField = options.nonZeroField ?? 'count';
    let filtered = collection.filter((x) => (!options.nonZero || (Number(x[nonZeroField]) || 0) > 0) && fullTextSearch(filter, x, fields));

    // if (sortBy == SortType.Slots) {
    // 	console.log('sorting by slots...');
    // 	let map = filtered.reduce(function (acc, curr) {
    // 		acc[curr.id] = (acc[curr.id] || 0) + 1;
    // 		return acc;
    // 	}, {});
    // 	console.log('map', map);

    // 	const countBySlots = Object.keys(map).sort(function (a, b) {
    // 		return map[b] - map[a];
    // 	});
    // 	/// TODO: mapping filtered by countBySlots
    // } else {
    // 	console.log('not sorting...');
    // }
    document.body.querySelectorAll('details.searchable').forEach((e) => {
        e.setAttribute('open', 'true');
    });
    return filtered;
}

function dec2hex(dec: number): string {
    return dec.toString(16).padStart(2, "0")
}

function generateId(len: number | undefined): string {
    var arr = new Uint8Array((len || 40) / 2)
    window.crypto.getRandomValues(arr)
    return Array.from(arr, dec2hex).join('')
}

function diff(createdAt: string | Date | number) {
    const dt = new Date(createdAt);
    return Math.floor((new Date().getTime() - dt.getTime()) / (1000 * 3600 * 24));
}
function tillBirthday(createdAt: string | Date | number) {
    return 365 - (diff(createdAt) % 365);
}

function age(createdAt: string | Date | number) {
    return Math.floor(diff(createdAt) / 365);
}

function hoursPlayed(time: number) {
    return Math.trunc(time / 3600);
}

function wikiLink(name: string) {
    return name ? `https://wiki.guildwars2.com/wiki/${name}`.replaceAll(' ', '_') : '#';
}

function apiItemLink(id: number | string) {
    return `https://api.guildwars2.com/v2/items/${id}`;
}

function getDeepProp(obj: unknown, str: string): unknown {
    if (typeof obj !== 'object' || obj === undefined || obj === null) return obj;
    if (!str) return obj;
    const fields = str.split(".");
    const head = fields[0];
    const tail = fields.slice(1).join(".");
    return getDeepProp((obj as Record<string, unknown>)[head], tail);
}

export function mapFields(obj: AnyRecord, fields: Array<string | Record<string, unknown>>) {
    if (fields.length) {
        const res: Record<string, unknown> = {};
        fields.forEach((x) => {
            if (wxjs_types.isObject(x)) {
                for (const [key, value] of Object.entries(x as Record<string, unknown>)) {
                    res[key] = value;
                }
            } else {
                const key = x as string;
                res[key] = getDeepProp(obj, key);
            }
        });
        return res;
    }
    return obj;
}

export function groupBy(collection: AnyRecord[], groups: string[] = [], mappings: Array<string | Record<string, unknown>>) {
    const grouped: Record<string, unknown> = {};
    collection.forEach((x: AnyRecord) => {
        let cursor: Record<string, unknown> = grouped;
        groups.forEach((g: string, i: number) => {
            const v = String(getDeepProp(x, g));
            cursor[v] = cursor[v] || (i + 1 === groups.length ? [] : {});
            if (i + 1 < groups.length) {
                cursor = cursor[v] as Record<string, unknown>;
            }
        });
        const finalKey = String(getDeepProp(x, groups[groups.length - 1] || ''));
        const bucket = (groups.length ? cursor[finalKey] : grouped.__root) as unknown[] | undefined;
        if (bucket) {
            bucket.push(mapFields(x, mappings));
        } else {
            grouped.__root = (grouped.__root as unknown[] | undefined) || [];
            (grouped.__root as unknown[]).push(mapFields(x, mappings));
        }
    });
    return grouped;
}

export default {
    match,
    filterCollection,
    fullTextSearch,
    generateId,
    dec2hex,
    diff,
    tillBirthday,
    age,
    hoursPlayed,
    wikiLink,
    apiItemLink,
}