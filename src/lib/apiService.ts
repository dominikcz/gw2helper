import Logger from "./logger";
import ls from "./wxjs_localstorage";
import wx from "./wxjs_types";
import { ACHIEVES_CACHE, ITEMS_CACHE, KEY_HIST, REQUESTS_CACHE } from "$lib/consts";

const apiUrl = "https://api.guildwars2.com";
const CACHE_TIMEOUT = 15 * 60;
const INVALID_IDS: number[] = [4589, 21083, 21242, 39350, 39351, 39352, 39353, 39354, 39355, 39356, 39748, 39749, 42424, 42426, 43353, 82854, 97730, 78599, 101651];
const INVALID_ACHIEVES_IDS: number[] = [];

const ignoreCache =
    typeof window != 'undefined'
        ? new URLSearchParams(window.location.search).get('ignore-cache') == '1'
        : false;

interface CacheEntry {
    time: Date | string;
    timeout: number;
    data: object;
}

const _items = ls.getObject(ITEMS_CACHE, null);
const _achievs = ls.getObject(ACHIEVES_CACHE, null);
const itemsCache = _items ? new Map(_items) : new Map();
const achievesCache = _achievs ? new Map(_items) : new Map();

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

const requestCacheName = (): string => {
    return `${REQUESTS_CACHE}.${_apiKey}`;
}

let requestCache: Map<string, CacheEntry>;

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
    ls.set(requestCacheName(), JSON.stringify([...requestCache.entries()]));
};

const apiClient = async (req: string | RequestInfo, query: string, options?: object) => {
    if (!_apiKey) {
        Logger.error('not initialized, please provide api key from https://account.arena.net');
        return null;
    }
    const origReq = req + query;
    const _options = Object.assign({}, fetchOptions, options);
    let cachedValue = !ignoreCache ? tryCache(origReq) : undefined;
    Logger.log(`cached value for ${origReq}`, cachedValue);
    if (cachedValue !== undefined) {
        Logger.log("requestCache is valid");
        return cachedValue;
    } else {
        Logger.log("requestCache is INVALID, refreshing...");

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
            Logger.log(`got response.status = ${response.status}... ignoring`);
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
            .filter(x => x != null)
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

const _getGuilds = async (full: boolean = false) => {
    const account = await apiClient("/v2/account", "");
    // concat and remove duplicates
    const _guilds = [...new Set([...account.guild_leader ,...account.guilds])];

    let tasks = [];
    for (const guild of _guilds) {
        tasks.push(apiClient(`/v2/guild/${guild}`, ""));
    }
    let _rawData = (await Promise.all(tasks)).flat();
    const defEmblem = {
        background: {
            id: 1,
            colors: [0]
        },
        foreground: {
            id: 60,
            colors: [443]
        },
        flags: []
    };
    if (full) {
        _rawData.forEach(x => {
            if (!x.emblem) {
                x.emblem = defEmblem
            }
        });
        const _emblems = _rawData.map(x => x.emblem);
        const fgs = [];
        const bgs = [];
        let clrs = [];

        // console.log('emblems', _emblems);
        for (const emblem of _emblems) {
            bgs.push(emblem.background.id);
            fgs.push(emblem.foreground.id);
            clrs.push(...emblem.background.colors.map(x => wx.isObject(x) ? x.id : x));
            clrs.push(...emblem.foreground.colors.map(x => wx.isObject(x) ? x.id : x));
        }
        clrs = [...new Set(clrs)].filter(x => x != null);
        const [colors, foregrounds, backgrounds] = await Promise.all([
            clrs.length ? apiClient('/v2/colors', "ids=" + clrs.join(',')) : [],
            apiClient('/v2/emblem/foregrounds', "ids=" + fgs.join(',')),
            apiClient('/v2/emblem/backgrounds', "ids=" + bgs.join(','))
        ]);
        for (const item of _rawData) {
            if (item.emblem) {
                addPropertiesById(item.emblem.foreground, foregrounds);
                addPropertiesById(item.emblem.background, backgrounds);
                item.emblem.foreground.colors = item.emblem.foreground.colors.map(color => colors.find(x => color == x.id));
                item.emblem.background.colors = item.emblem.background.colors.map(color => colors.find(x => color == x.id));
            }
        }
        // console.log('emblems', {bgs, fgs, clrs});
        // console.log('emblems data', _rawData)
    }
    return _rawData;
}

const guildItems = async () => {
    const items = [];
    const guilds = await _getGuilds(false);
    for (const guild of guilds) {
        const stashRaw = (await apiClient(`/v2/guild/${guild.id}/stash`, ""))
            .map((x) => x.inventory)
            .flat()
            .filter((x) => x != null);
        const ids = stashRaw.map((x) => x.id);
        items.push({
            name: guild.name,
            stash: await expandItems(ids, stashRaw),
        });
    }
    return items;
};

const characters = async () => {
    return (await apiClient("/v2/characters", "ids=all")).map(x => ({ ...x, crafting_discipline: x.crafting.map(c => c.discipline).flat().join(', ') }));
};

const guilds = async () => {
    return _getGuilds(true);
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
    let data = await apiClient("/v2/account/achievements", "");
    if (!all) {
        data = data.filter(x => !x.done)
    }
    expandAchieves(data)
    return data;
};

const achievementsInfo = async (ids: string) => {
    let data = await apiClient("/v2/achievements", "ids=" + ids);
    return data;
};

const currencies = async () => {
    const depreciated = [
        {
            reason: 'Replaced by "Tales of Dungeon Delving"',
            ids: [5, 6, 9, 10, 11, 12, 13, 14]
        },
        {
            reason: 'Replaced by "Blue Prophet Shard"',
            ids: [52, 53]
        },
        {
            reason: 'Replaced by "Blue Prophet Crystal"',
            ids: [55, 56]
        },
    ];
    // denormalize
    const _dep = depreciated.flatMap(({ reason, ids }) => ids.map(id => ({ depreciated: true, depreciationReason: reason, id })));
    const ignored = [74];
    const _rawData = (await apiClient("/v2/currencies", "ids=all"))
        .filter(x => !ignored.includes(x.id));
    return mergeById(_rawData, _dep);
}

const wallet = async () => {
    const [_curr, _wallet] = await Promise.all([currencies(), apiClient("/v2/account/wallet", "")]);
    return mergeById(_curr, _wallet);
}

const init = (apiKey: string, options?: object) => {
    Logger.log("init", apiKey);
    _apiKey = apiKey;
    fetchOptions = Object.assign({}, fetchOptions, options);
    const _req = ls.getObject(requestCacheName(), null);

    requestCache = _req ? new Map<string, CacheEntry>(_req) : new Map<string, CacheEntry>();
};

const mergeById = (a1, a2) => {
    return a1.filter((x) => x != undefined).map((t1) => ({ ...t1, ...a2.find((t2) => t2.id === t1.id) }));
};

const addPropertiesById = (base: object, details: array) => {
    const clone = JSON.parse(JSON.stringify(base));
    const match = details.find(x => x.id == base.id);
    // console.log('addPropertiesById', {clone, details})
    for (const key of Object.keys(match)) {
        if (key != 'id') {
            base[key] = match[key];
        }
    }
}

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
        resp.forEach((x) => {
            if (x) {
                itemsCache.set(x.id, x);
            }
        });
        ls.set(ITEMS_CACHE, JSON.stringify([...itemsCache.entries()]));
        data.push(...mergeById(resp, collection));
    }
    if (knownFromReqest.length) {
        data.push(...mergeById(knownFromReqest, collection));
    }
    additionalMapping(data);

    return data;
};

const expandAchieves = async (accountAchieves) => {
    const knownIds = [...achievesCache.keys()];
    const ids = accountAchieves.map(x => x.id).filter((x) => !INVALID_ACHIEVES_IDS.includes(x));
    const missingIds = ids.filter((x) => !knownIds.includes(x));
    const knownFromReqest = ids.filter((x) => knownIds.includes(x)).map((x) => achievesCache.get(x));

    const data = [];
    const batches = [];
    do {
        let batch = missingIds.splice(0, 200);
        if (batch.length > 0) {
            batches.push(batch.join(","));
        }
    } while (missingIds.length > 0);
    console.log('batches', batches)
    if (batches.length) {
        const tasks = batches.map((ids) => achievementsInfo(ids));
        const resp = (await Promise.all(tasks)).flat();
        resp.forEach((x) => {
            if (x) {
                achievesCache.set(x.id, x);
            }
        });
        ls.set(ACHIEVES_CACHE, JSON.stringify([...achievesCache.entries()]));
        data.push(...mergeById(resp, accountAchieves));
    }
    if (knownFromReqest.length) {
        data.push(...mergeById(knownFromReqest, accountAchieves));
    }
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

const clearCache = () => {
    console.log('clearing cache...');
    ls.delete(requestCacheName());
    ls.delete(ITEMS_CACHE);
    ls.delete(ACHIEVES_CACHE);
    ls.delete(KEY_HIST);
    itemsCache.clear();
    achievesCache.clear();
    requestCache.clear();
}

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
    guilds,
    currencies,
    wallet,
    clearCache,
};
