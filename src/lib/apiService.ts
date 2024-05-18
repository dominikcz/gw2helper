import Logger from "./logger";

const apiUrl = "https://api.guildwars2.com";
const CACHE_TIMEOUT = 15 * 60;

interface CacheEntry {
    time: Date;
    timeout: number;
    data: object;
}

const cache = new Map<string, CacheEntry>();

let _apiKey = "";
let fetchOptions = {
    method: "GET",
    baseURL: apiUrl,
    timeout: 10000,
    expectJson: true,
    onError({ request, error, options }) {
        Logger.error(`apiClient response error ${error.code}: ${error.message} \n req: ${JSON.stringify(request)}, options: ${JSON.stringify(options)}`);
    },
    fetchFunction: fetch,
    debug: false,
};

const notifyOnError = (req, error, options) => {
    if (fetchOptions.onError) {
        fetchOptions.onError(req, error, options);
    }
};

const secondsBetween = (d1: Date, d2: Date): number => {
    const diff = Math.round(Math.abs(d1.getTime() - d2.getTime()) / 1000);
    return diff;
};

const tryCache = (req: string): object | undefined => {
    if (cache.has(req)) {
        let info = cache.get(req);
        if (secondsBetween(info!.time, new Date()) < CACHE_TIMEOUT) {
            return info!.data;
        }
    }
    return undefined;
};

const apiClient = async (req: string | RequestInfo, query: string, options?: object) => {
    const origReq = req+query;
    let cachedValue = tryCache(origReq);
    Logger.log(`cached value for ${origReq}`, cachedValue);
    if (cachedValue !== undefined) {
        Logger.log("cache is valid");
        return cachedValue;
    } else {
        Logger.log("cache is INVALID, refreshing...");

        const _options = Object.assign({}, fetchOptions, options);
        if (typeof req == "string") {
            req = _options.baseURL + req;
        }

        if (_options.debug) {
            Logger.log(`req: ${req}, options: `, _options);
        }
        const response = await _options.fetchFunction(`${req}?access_token=${_apiKey}${query ? "&" : ""}${query}`, _options);
        if (!response.ok) {
            console.warn("error", response);
            notifyOnError(req, new Error(`HTTP error, status = ${response.status}`), _options);
        } else {
            let data;
            if (_options.expectJson) {
                data = await response.json();
            } else {
                data = await response.text();
            }
            if (_options.transform) {
                data = _options.transform(data);
            }
            cachedValue = data;
            cache.set(origReq, {
                time: new Date(),
                data: cachedValue,
            });
            Logger.log(`cache for ${origReq} updated`, cachedValue);
        }
    }
    return cachedValue;
};

const charactersItems = async () => {
    const rawData = await apiClient("/v2/characters", "ids=all");
    const tasks = [];
    for (const char of rawData) {
        let itemsInBags = char.bags
            .map((bag) => bag.inventory)
            .flat()
            .filter((x) => x != null);
        let equipment = char.equipment.flat().filter((x) => x != null);
        let charItems = itemsInBags.concat(equipment);
        let ids = charItems.map((x) => x.id);
        char._items = await expandItems(ids, charItems);
    };
    return rawData;
};

const characters = async () => {
    return await apiClient("/v2/characters", "ids=all");
};

const items = (x: string) => {
    return apiClient("/v2/items", "ids=" + x);
};

const sharedInventory = async () => {
    // this endpoint returns null in "empty" slots and we don't want that
    const rawData = await apiClient("/v2/account/inventory", "", {
        transform: (data) => {
            return data.filter((x) => x != null);
        },
    });
    const ids = rawData.map((x) => x.id);
    return expandItems(ids, rawData);
};

const bank = async () => {
    // this endpoint returns null in "empty" slots and we don't want that
    const rawData = await apiClient("/v2/account/bank", "", {
        transform: (data) => {
            return data.filter((x) => x != null);
        },
    });
    const ids = rawData.map((x) => x.id);
    return expandItems(ids, rawData);
};

const init = (apiKey: string, options?: object) => {
    Logger.log("init", apiKey);
    _apiKey = apiKey;
    fetchOptions = Object.assign({}, fetchOptions, options);
};

const mergeById = (a1, a2) => {
    return a1.map((t1) => ({ ...t1, ...a2.find((t2) => t2.id === t1.id) }));
};

const expandItems = async (ids: Array<number>, collection) => {
    const batches = [];
    do {
        let batch = ids.splice(0, 200);
        if (batch.length > 0) {
            batches.push(batch.join(","));
        }
    } while (ids.length > 0);
    if (batches.length) {
        const tasks = batches.map((ids) => items(ids));
        const resp = (await Promise.all(tasks)).flat();
        let data = mergeById(resp, collection);
        additionalMapping(data);
        return data;
    }

    return null;
};

const additionalMapping = (data) => {
    data.forEach(element => {
        if (element.details){
            if (element.details.type){
                element.subtype = element.details.type;
            }
            if (element.details.description){
                element.subdescr = element.details.description;
            }
        }
    });
}

export default {
    init,
    characters,
    charactersItems,
    sharedInventory,
    bank,
    items,
};
