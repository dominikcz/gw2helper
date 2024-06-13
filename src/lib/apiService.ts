import Logger from "./logger";
import wxjs_localstorage from "./wxjs_localstorage";

const apiUrl = "https://api.guildwars2.com";
const CACHE_TIMEOUT = 15 * 60;
const REQUESTS_CACHE = "gw2helper.requests_cache";
const ITEMS_CACHE = "gw2helper.items_cache";
const INVALID_IDS = [4589, 21083, 21242, 39350, 39351, 39352, 39353, 39354, 39355, 39356, 39748, 39749, 42424, 42426, 43353, 82854, 97730, 101651];

interface CacheEntry {
    time: Date | string;
    timeout: number;
    data: object;
}

const _items = wxjs_localstorage.getObject(ITEMS_CACHE, null);
const itemsCache = _items ? new Map(_items) : new Map();

const _req = wxjs_localstorage.getObject(REQUESTS_CACHE, null);
const requestCache = _req ? new Map<string, CacheEntry>(_req) : new Map<string, CacheEntry>();

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

const secondsBetween = (d1: Date | string, d2: Date): number => {
    if (typeof d1 == 'string') {
        d1 = new Date(d1);
    }
    const diff = Math.round(Math.abs(d1.getTime() - d2.getTime()) / 1000);
    return diff;
};

const tryCache = (req: string): object | undefined => {
    if (_apiKey && requestCache.has(req)) {
        let info = requestCache.get(req);
        if (secondsBetween(info!.time, new Date()) < CACHE_TIMEOUT) {
            return info!.data;
        } 
    }
    return undefined;
};

const cacheRequest = (req: string, value: any) => {
    const obj = {
        time: new Date(),
        data: value,
    };
    requestCache.set(req, obj);
    wxjs_localstorage.set(REQUESTS_CACHE, JSON.stringify([...requestCache.entries()]));
};

const apiClient = async (req: string | RequestInfo, query: string, options?: object) => {
    if (!_apiKey) {
        Logger.error('not initialized, please provide api key from https://account.arena.net');
        return;
    }
    const origReq = req + query;
    let cachedValue = tryCache(origReq);
    Logger.log(`cached value for ${origReq}`, cachedValue);
    if (cachedValue !== undefined) {
        Logger.log("requestCache is valid");
        return cachedValue;
    } else {
        Logger.log("requestCache is INVALID, refreshing...");

        const _options = Object.assign({}, fetchOptions, options);
        if (typeof req == "string") {
            req = _options.baseURL + req;
        }

        if (_options.debug) {
            Logger.log(`req: ${req}, options: `, _options);
        }
        const response = await _options.fetchFunction(`${req}?access_token=${_apiKey}${query ? "&" : ""}${query}`, _options);
        if (response.status >= 500) {
            console.warn("error", response);
            notifyOnError(req, new Error(`HTTP error, status = ${response.status}`), _options);
        } else if (response.ok) {
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
            cacheRequest(origReq, cachedValue);

            Logger.log(`requestCache for ${origReq} updated`, cachedValue);
        } else {
            console.log(`got response.status = ${response.status}... ignoring`);
            cachedValue = query ? [] : {};
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
    }
    return rawData;
};

const materials = async () => {
    const rawData = await apiClient("/v2/account/materials", "");
    let ids = rawData.map((x) => x.id);
    return await expandItems(ids, rawData);
};

const guildItems = async () => {
    const account = await apiClient("/v2/account", "");
    const _guilds = account.guild_leader || account.guilds;

    const items = [];
    let tasks = [];

    for (const guild of _guilds) {
        tasks.push(apiClient(`/v2/guild/${guild}`, ""));
    }
    const guilds = (await Promise.all(tasks)).flat();
    // console.log('guilds', guilds);

    for (const guild of guilds) {
        const stashRaw = (await apiClient(`/v2/guild/${guild.id}/stash`, ""))
            .map((x) => x.inventory)
            .flat()
            .filter((x) => x != null);
        // console.log('stash of '+guild.name, stashRaw);
        const ids = stashRaw.map((x) => x.id);
        items.push({
            name: guild.name,
            stash: await expandItems(ids, stashRaw),
        });
    }
    // console.log("guildItems", items);
    return items;
};

const characters = async () => {
    return await apiClient("/v2/characters", "ids=all");
};

const items = (x: string) => {
    return apiClient("/v2/items", "ids=" + x);
};

const account = () => {
    return apiClient("/v2/account", "");
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

const tokenInfo = async () => {
    return await apiClient("/v2/tokeninfo", "");
};

const achievements = async (all: boolean = false) => {
    let data =  await apiClient("/v2/account/achievements", "");
    if (!all) {
        data =  data.filter(x => !x.done)
    }
    return data;
};

const init = (apiKey: string, options?: object) => {
    Logger.log("init", apiKey);
    _apiKey = apiKey;
    fetchOptions = Object.assign({}, fetchOptions, options);
};

const mergeById = (a1, a2) => {
    return a1.filter((x) => x != undefined).map((t1) => ({ ...t1, ...a2.find((t2) => t2.id === t1.id) }));
};

const expandItems = async (ids: Array<number>, collection) => {
    const knownIds = [...itemsCache.keys()];
    ids = ids.filter((x) => !INVALID_IDS.includes(x));
    const missingIds = ids.filter((x) => !knownIds.includes(x));
    const knownFromReqest = ids.filter((x) => knownIds.includes(x)).map((x) => itemsCache.get(x));

    const data = [];
    const batches = [];
    do {
        let batch = missingIds.splice(0, 200);
        if (batch.length > 0) {
            batches.push(batch.join(","));
        }
    } while (missingIds.length > 0);
    if (batches.length) {
        const tasks = batches.map((ids) => items(ids));
        const resp = (await Promise.all(tasks)).flat();
        console.log("resp", resp);
        resp.forEach((x) => {
            if (x) {
                itemsCache.set(x.id, x);
            }
        });
        wxjs_localstorage.set(ITEMS_CACHE, JSON.stringify([...itemsCache.entries()]));
        data.push(...mergeById(resp, collection));
    }
    if (knownFromReqest.length) {
        data.push(...mergeById(knownFromReqest, collection));
    }
    additionalMapping(data);

    return data;
};

const additionalMapping = (data) => {
    data.forEach((element) => {
        if (element.details) {
            if (element.details.type) {
                element.subtype = element.details.type;
            }
            if (element.details.description) {
                element.subdescr = element.details.description;
            }
        }
    });
};

export default {
    init,
    characters,
    charactersItems,
    sharedInventory,
    bank,
    items,
    account,
    guildItems,
    materials,
    tokenInfo,
    achievements,
};
