export type FilterOptions = {
    nonZero?: boolean,
    nonZeroField?: string,
}

const DEFAULT_FILTER_OPTIONS: FilterOptions = {
    nonZero: false,
    nonZeroField: 'count',
}

function match(word: string, obj: object, properties: Array<string>) {
    // at least one property has to match
    return properties.some((x) => {
        if (obj['count'] != undefined && ['>', '<'].includes(word.charAt(0))) {
            if (word.startsWith('>')) {
                return obj.count ? obj.count > parseInt(word.slice(1)) : false;
            }
            if (word.startsWith('>=')) {
                return obj.count ? obj.count >= parseInt(word.slice(2)) : false;
            }
            if (word.startsWith('<')) {
                return obj.count ? obj.count < parseInt(word.slice(1)) : false;
            }
            if (word.startsWith('<=')) {
                return obj.count ? obj.count <= parseInt(word.slice(2)) : false;
            }
        } else {
            if (typeof obj[x] === 'string' && obj[x].toLowerCase().includes(word)) {
                return true;
            }
        }
        return false;
    });
}

function fullTextSearch(filter: string, obj: object, properties: Array<string>) {
    if (!filter) return true;
    const f = filter.toLowerCase();

    const words = f.split(' ');
    // all words have to be found somewhere
    return words.every((x) => match(x, obj, properties));
}

function filterCollection(collection: Array<object>, fields: Array<string>, filter: string, options: FilterOptions = DEFAULT_FILTER_OPTIONS) {
    let filtered = collection.filter((x) => (!options.nonZero || x[options.nonZeroField] > 0) && fullTextSearch(filter, x, fields));

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
        e.setAttribute('open', true);
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

function diff(createdAt) {
    const dt = new Date(createdAt);
    return Math.floor((new Date().getTime() - dt.getTime()) / (1000 * 3600 * 24));
}
function tillBirthday(createdAt) {
    return 365 - (diff(createdAt) % 365);
}

function age(createdAt) {
    return Math.floor(diff(createdAt) / 365);
}

function hoursPlayed(time) {
    return Math.trunc(time / 3600);
}

function wikiLink(name) {
    return name ? `https://wiki.guildwars2.com/wiki/${name}`.replaceAll(' ', '_') : '#';
}

function getDeepProp(obj, str) {
    if (typeof obj !== 'object' || obj === undefined) return obj;
    const fields = str.split(".");
    return getDeepProp(obj[fields[0]], fields.slice(1).join("."));
}

function mapFields(obj, fields){
    if (fields.length) {
        const res = {};
        fields.forEach(x => {
            res[x] = getDeepProp(obj, x);
        })
        return res;
    }
    return obj;
}

export function groupBy(collection, groups = [], mappings) {
    const grouped = {};
    collection.forEach((x) => {
        groups.reduce((o, g, i) => {
            let v = getDeepProp(x, g);
            o[v] = o[v] || (i + 1 === groups.length ? [] : {});
            return o[v];
        }, grouped).push(mapFields(x, mappings));
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
    }