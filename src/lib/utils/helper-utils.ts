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

function filterCollection(collection, filter, nonZero, nonZeroField = 'count', sortBy) {
    let filtered = collection.filter((x) => {
        return (!nonZero || x[nonZeroField] > 0) && fullTextSearch(filter, x, ['name', 'description', 'type', 'subtype', 'subdescr', 'rarity']);
    });
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

function dec2hex (dec: number): string {
    return dec.toString(16).padStart(2, "0")
}

function generateId(len: number | undefined): string {
    var arr = new Uint8Array((len || 40) / 2)
    window.crypto.getRandomValues(arr)
    return Array.from(arr, dec2hex).join('')
}

export default {
    match,
    filterCollection,
    fullTextSearch,
    generateId,
    dec2hex,
}