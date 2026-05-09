import Logger from "./logger";
import ls from "./wxjs_idb";
import wx from "./wxjs_types";
import { ACHIEVEMENTS_CACHE, ITEMS_CACHE, KEY_HIST, MINIS_CACHE, REQUESTS_CACHE, SKINS_CACHE } from "$lib/consts";
import { sum, getQueryStringFlag } from "./utils";
import wxjs_types from "./wxjs_types";
import { INACTIVE_ACHIEVEMENTS_CATEGORIES, SEASONAL_ACHIEVEMENTS_CATEGORIES, sumRewards } from "./components/achievements/achievements";
import { groupBy, mapFields } from "./utils/helper-utils";
import wxdates from "./wxjs_dates";

const defaultApiUrl = "https://api.guildwars2.com";
const mockApiUrl = "http://localhost:3000";
const CACHE_TIMEOUT = 5 * 60;
const INVALID_ITEM_IDS: number[] = [4589, 39350, 39351, 39352, 39353, 39354, 39355, 39356];
const INVALID_ACHIEVEMENTS_IDS: number[] = [];
const ACHIEVEMENTS_NOT_IN_API: Record<string, number[]> = {
    // Rift Hunting
    // TODO: will have to change to list of objects and get achievements' descriptions from wiki :(
    // 361: [7661, 7080, 7697, 7615, 7700, 7637, 7729, 7632, 7723, 7674, 7235, 7228, 7007, 7123, 7142, 7635],
}

type GW2HelperSettings = {
    currentSeason: string;
    wizardsVault: {
        seasonEnd: string;
    };
};

let _settings: GW2HelperSettings = {
    currentSeason: '',
    wizardsVault: {
        seasonEnd: '2026-05-12T16:00:00+00:00',
    },
};
    

// const unique = function (tab) {
//     return tab.filter(function (el, i, self) {
//         return self.indexOf(el) === i;
//     });
// };

const REQUIRED_SCOPES: Record<string, string[]> = {
    "/v2/account": ['account' /*, 'progression' */],
    "/v2/account/achievements": ['account', 'progression'],
    "/v2/account/bank": ['account', 'inventories'],
    "/v2/account/inventory": ['account', 'inventories'],
    "/v2/account/legendaryarmory": ['account', 'inventories', 'unlocks'],
    "/v2/account/materials": ['account', 'inventories'],
    "/v2/account/wallet": ['account', 'wallet'],
    "/v2/account/wizardsvault/*": ['account', 'progression'],
    "/v2/characters": ['account', 'characters'],
    "/v2/commerce": ['account', 'tradingpost'],
    "/v2/guild/*": ['account', 'guilds'],
}

function getScopes(req: string) {
    if (REQUIRED_SCOPES[req]) return REQUIRED_SCOPES[req];
    const rs = Object.keys(REQUIRED_SCOPES).find(x => req.startsWith(x.replace('*', '')));
    return rs ? REQUIRED_SCOPES[rs] : [];
}

interface ScopeError extends Error {
    missingScopes: string[]
}

function ScopeError(missingScopes: string[]) {
    const error = new Error("Missing permissions: " + missingScopes.join(', ')) as ScopeError;
    error.name = "ScopeError";
    error.missingScopes = missingScopes
    return error;
}

const SCHEMA_VERSION = '2019-12-19T00:00:00.000Z'; // or 'latest'?

const ignoreCache = getQueryStringFlag('ignore-cache');
const devMode = getQueryStringFlag('dev-mode');
const realApi = getQueryStringFlag('real-api');


interface CacheEntry {
    time: Date | string;
    timeout: number;
    data: any;
}

interface TokenInfo {
    id: string;
    name: string;
    permissions: string[];
    missingScopes: string[];
    error: string | null;
}

interface ApiClientOptions extends RequestInit {
    baseURL: string;
    timeout: number;
    expectJson: boolean;
    apiLang: string;
    onError(request: RequestInfo | string, response: Response, options: object): void;
    fetchFunction: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    debug: boolean;
    transform?: (data: any) => any;
}

let _items: [number, any][] | undefined;
let _minis: [number, any][] | undefined;
let _skins: [number, any][] | undefined;
let _achievements: [number, any][] | undefined;
let itemsCache: Map<number, any>;
let minisCache: Map<number, any>;
let skinsCache: Map<number, any>;
let achievementsCache: Map<number, any>;
let requestCache: Map<string, CacheEntry>;
let inflightItems: Map<number, Promise<any>> = new Map();
let _tokenInfo: TokenInfo = {
    id: '',
    name: '',
    permissions: [],
    error: null,
    missingScopes: [],
};

let _apiKey = "";
let fetchOptions: ApiClientOptions = {
    method: "GET",
    baseURL: devMode ? realApi ? defaultApiUrl : mockApiUrl : defaultApiUrl,
    timeout: 10000,
    expectJson: true,
    apiLang: 'en',
    onError(request: Request, response: Response, options: object) {
        Logger.error(`apiClient response error ${response?.status}: ${response?.statusText ? response?.statusText : '(HTTP status: ' + response?.status + ')'} \n req: ${JSON.stringify(request)}, options: ${JSON.stringify(options)}`, response);
    },
    fetchFunction: fetch,
    debug: false,
};

const requestCacheName = (): string => {
    return `${REQUESTS_CACHE}.${_apiKey}`;
}

// const notifyOnError = (req, error, options) => {
//     if (fetchOptions.onError) {
//         fetchOptions.onError(req, error, options);
//     }
// };

const secondsBetween = (d1: Date | string, d2: Date): number => {
    if (typeof d1 == 'string') {
        d1 = new Date(d1);
    }
    const diff = Math.round(Math.abs(d1.getTime() - d2.getTime()) / 1000);
    return diff;
};

const tryCache = (req: string): CacheEntry | undefined => {
    if (_apiKey && requestCache.has(req)) {
        let info = requestCache.get(req);
        let secs = secondsBetween(info!.time, new Date());
        if (secs < CACHE_TIMEOUT) {
            console.log('tryCache', req, secs, 'reusing cache')
            return info;
        }
    }
    return undefined;
};

const cacheRequest = async (req: string, value: any) => {
    const obj: CacheEntry = {
        time: new Date(),
        timeout: CACHE_TIMEOUT,
        data: value,
    };
    requestCache.set(req, obj);
    await ls.set(requestCacheName(), [...requestCache.entries()]);
};

const getFromAchievementsCache = (key: string): any => {
    return achievementsCache.get(Number(key));
}

const readSettings = async () => {
    const response = await fetchOptions.fetchFunction('/gw2helper_settings.json').catch(error => {
        Logger.error('error loading settings', error);
    });
    if (response?.ok) {
        let data = await response.json();
        _settings = Object.assign({}, _settings, data);
    } else if (response) {
        Logger.warn('error loading settings', { status: response.status, url: response.url });
    }
    // code below is not really correct as season end is not always 3 months after season start, but it will do as a fallback
    let seasonEnd: Date | undefined = new Date(_settings.wizardsVault.seasonEnd);
    if (seasonEnd < new Date()){
        while (seasonEnd && seasonEnd < new Date()) {
            seasonEnd = wxdates.dateAdd(seasonEnd, 'month', 3);
        }
        if (seasonEnd) {
            _settings.wizardsVault.seasonEnd = seasonEnd.toISOString();
        }
    }
}

const apiClient = async (req: string | RequestInfo, query: string, options?: Partial<ApiClientOptions>) => {
    if (!_apiKey) {
        Logger.error('not initialized, please provide api key from https://account.arena.net');
        return null;
    }
    const scopeReq = typeof req === 'string' ? req : req instanceof Request ? req.url : String(req);
    let missingScopes = getScopes(scopeReq).filter(x => !_tokenInfo.permissions.includes(x));
    if (missingScopes.length) {
        _tokenInfo.missingScopes.push(...missingScopes);
        throw ScopeError(missingScopes)
    }
    query = query ? `lang=${fetchOptions.apiLang}&${query}` : `lang=${fetchOptions.apiLang}`;
    const origReq = req + query;
    const _options: ApiClientOptions = Object.assign({}, fetchOptions, options);
    const cacheEntry = !ignoreCache ? tryCache(origReq) : undefined;
    if (cacheEntry !== undefined) {
        Logger.log("requestCache is valid, returning cached response");
        return cacheEntry.data;
    }

    Logger.log("requestCache is INVALID, refreshing...");

    if (typeof req == "string") {
        req = _options.baseURL + req;
    }

    if (_options.debug) {
        Logger.log(`req: ${req}, options: `, _options);
    }
    const response = await _options.fetchFunction(`${req}?access_token=${_apiKey}${query ? "&" : ""}${query}`, _options as RequestInit).catch(error => {
        Logger.error('error', error);
    });
    if (response && response.status >= 400) {
        const body = await response.text();

        if (response.headers.get('content-type')?.includes('application/json')) {
            let errorMsg = '';
            try {
                errorMsg = JSON.parse(body)?.text || '';
            } catch {
                errorMsg = '';
            }
            if (errorMsg !== "") {
                throw new Error(errorMsg);
            } else {
                throw new Error(body);
            }
        } else {
            throw new Error(body);
        }

    } else if (response?.ok) {
        let data;
        if (_options.expectJson) {
            data = await response.json();
        } else {
            data = await response.text();
        }
        if (_options.transform) {
            data = _options.transform(data);
        }
        cacheRequest(origReq, data);
        Logger.log(`requestCache for ${origReq} updated`, data);
        return data;
    }

    Logger.warn(`got response.status = ${response?.status} for ${origReq}... returning empty`);
    return query ? [] : {};
};

const charactersItems = async () => {
    const rawData: any[] = (await apiClient("/v2/characters", "ids=all")) || [];
    for (const char of rawData) {
        let bags = (char.bags || []).filter((x: any) => x != null).map((x: any) => ({ id: x.id, size: x.size, count: 1 }));
        let itemsInBags = (char.bags || [])
            .filter((x: any) => x != null)
            .map((bag: any) => bag.inventory)
            .flat()
            .filter((x: any) => x != null);
        let equipment = (char.equipment || []).flat().filter((x: any) => x != null).map((x: any) => ({ ...x, count: 1, equipped: true }));
        let charItems = bags.concat(itemsInBags).concat(equipment);
        const addons: number[] = [];
        charItems.forEach((x: any) => {
            addons.push(...(x.upgrades || []), ...(x.infusions || []));
        })
        charItems.push(...addons.map((x: number) => ({ id: x, count: 1, equipped: true })))
        let ids: number[] = charItems.map((x: any) => x.id);
        char._items = await expandItems(ids, charItems);
    }
    return rawData;
};

const materials = async () => {
    const rawData: any[] = (await apiClient("/v2/account/materials", "")) || [];
    const ids: number[] = rawData.map((x: any) => x.id);
    return expandItems(ids, rawData);
};


function sumQuantities(data: any[]) {
    // for more general function use sumGroupBy from utils.js
    return Object.values(data.reduce((result: Record<string, any>, item: any) => {
        // Create a unique key combining item_id and price
        const key = `${item.item_id}-${item.price}`;
        // If the key already exists, add to the existing quantity
        if
            (result[key]) { result[key].count += item.count; }
        else {
            // Otherwise, initialize the quantity with the current item's quantity
            result[key] = { ...item };
        }
        return result;
    }, {})); // Initialize with an empty object
}

const _getTransactions = async (_transactions: any[]) => {
    const transactions = _transactions.map((x: any) => ({
        ...x,
        transId: x.id,
        id: x.item_id,
        count: x.quantity,

    }));


    const ids: number[] = transactions.map((x: any) => x.id);

    // let sum = sumGroupBy(exp, ['item_id', 'price'], 'count')
    let sum = sumQuantities(transactions);
    sum = await expandItems(ids, sum);
    sum = await expandPrices(ids, sum);
    // console.log('sum', sum, transactions)
    return sum;
}

const transactionsCurrent = async () => {
    const [_buys, _sells] = await Promise.all([
        apiClient("/v2/commerce/transactions/current/buys", ""),
        apiClient("/v2/commerce/transactions/current/sells", "")
    ]);
    const [buys, sells] = await Promise.all([
        _getTransactions(_buys),
        _getTransactions(_sells)
    ]);
    return { buys, sells };
}

const _getGuilds = async (full: boolean = false) => {
    const account = await apiClient("/v2/account", "");
    // concat and remove duplicates
    const _guilds = [...new Set([...(account.guild_leader || []), ...account.guilds])];

        let tasks: Promise<any>[] = [];
        for (const guild of _guilds) {
            tasks.push(apiClient(`/v2/guild/${guild}`, ""));
        }
        let _rawData: any[] = (await Promise.all(tasks)).flat();
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
            _rawData.forEach((x: any) => {
                x.emblem ??= defEmblem
            });
            const _emblems = _rawData.map((x: any) => x.emblem);
            const fgs: number[] = [];
            const bgs: number[] = [];
            let clrs: number[] = [];

            // console.log('emblems', _emblems);
            for (const emblem of _emblems) {
                bgs.push(emblem.background.id);
                fgs.push(emblem.foreground.id);
                clrs.push(...emblem.background.colors.map((x: any) => wx.isObject(x) ? x.id : x));
                clrs.push(...emblem.foreground.colors.map((x: any) => wx.isObject(x) ? x.id : x));
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
                    item.emblem.foreground.colors = item.emblem.foreground.colors.map((color: any) => colors.find((x: any) => color == x.id));
                    item.emblem.background.colors = item.emblem.background.colors.map((color: any) => colors.find((x: any) => color == x.id));
                }
            }
            // console.log('emblems', {bgs, fgs, clrs});
            // console.log('emblems data', _rawData)
        }
    return _rawData;
}

const guildItems = async () => {
    const items: any[] = [];
    const guilds = await _getGuilds(false);
    for (const guild of guilds) {
        try {
            let stashRaw: any[] | any = await apiClient(`/v2/guild/${guild.id}/stash`, "");
            if (!wxjs_types.isArray(stashRaw)) {
                continue;
            }
            stashRaw = stashRaw
                .map((x: any) => x.inventory)
                .flat()
                .filter((x: any) => x != null);
            const ids = stashRaw.map((x: any) => x.id);
            items.push({
                name: guild.name,
                stash: await expandItems(ids, stashRaw),
            });
        } catch (error) {
            items.push({
                name: guild.name,
                stash: [],
                error: error instanceof Error ? error.message : String(error),
            });
        }
    }
    return items;
};

const characters = async () => {
    const resp: any[] = (await apiClient("/v2/characters", "ids=all")) || [];
    return resp.map((x: any) => ({ ...x, crafting_discipline: (x.crafting || []).map((c: any) => c.discipline).flat().join(', ') }));
};

const guilds = async () => {
    return _getGuilds(true);
};

const items = (x: string) => {
    return apiClient("/v2/items", `ids=${x}`);
};

const legendaries = async () => {
    const [available, unlocked]: [any[], any[]] = await Promise.all([
        apiClient("/v2/legendaryarmory", `ids=all`),
        apiClient("/v2/account/legendaryarmory", ``)
    ]);
    const ids: number[] = available.map((x: any) => x.id);
    const expanded = await expandItems(ids, available);
    const data = mergeById(expanded, unlocked);
    const armor = (groupBy as any)(data.filter((x: any) => x.type === "Armor"), ['details.weight_class', 'subtype'], ['id', 'name', 'icon', 'max_count', 'count', 'rarity']);
    const trinkets = (groupBy as any)(data.filter((x: any) => x.type === "Trinket" && x.id !== 95093), ['subtype'], ['id', 'name', 'description', 'icon', 'max_count', 'count', 'rarity']);
    const back = data.filter((x: any) => x.type === "Back").map((x: any) => mapFields(x, ['id', 'name', 'description', 'icon', 'max_count', 'count', 'rarity']));
    const upgrades = data.filter((x: any) => ['Rune', 'Sigil'].includes(x.subtype) || x.type == 'Relic').map((x: any) => mapFields(x, ['id', 'name', 'description', 'icon', 'max_count', 'count', 'rarity', { equipped: true }]));
    const _weapons = data.filter((x: any) => x.type === "Weapon");
    _weapons.forEach((x: any) => {
        // change subtype naming to match current one in game & Wiki
        if (x.subtype == 'Harpoon') x.subtype = 'Spear';
        else if (x.subtype == 'Speargun') x.subtype = 'Harpoon gun';
        else if (x.subtype == 'LongBow') x.subtype = 'Long bow';
        else if (x.subtype == 'ShortBow') x.subtype = 'Short bow';
    })
    const weapons = (groupBy as any)(_weapons, ['subtype'], ['id', 'name', 'description', 'icon', 'max_count', 'count', 'rarity']);
    return { armor, trinkets, back, upgrades, weapons };
};

const prices = (x: string) => {
    return apiClient("/v2/commerce/prices", `ids=${x}`);
};

const account = async () => {
    const _acc = await apiClient("/v2/account", `v=${SCHEMA_VERSION}`);
    _acc.created_local = new Date(_acc.created).toLocaleString();
    _acc.last_modified_local = new Date(_acc.last_modified).toLocaleString();
    return _acc;
};

const sharedInventory = async () => {
    const resp: any[] = (await apiClient("/v2/account/inventory", "")) || [];
    // this endpoint returns null in "empty" slots and we don't want that
    const rawData = resp.filter((x: any) => x != null);
    const ids: number[] = rawData.map((x: any) => x.id);
    return expandItems(ids, rawData);
};

const bank = async () => {
    const resp: any[] = (await apiClient("/v2/account/bank", "")) || [];
    // this endpoint returns null in "empty" slots and we don't want that
    const rawData = resp.filter((x: any) => x != null);
    const ids: number[] = rawData.map((x: any) => x.id);
    return expandItems(ids, rawData);
};

const tokenInfo = async (): Promise<TokenInfo> => {
    return apiClient("/v2/tokeninfo", "");
};

const achievements = async (all: boolean = false) => {
    const [categories, account, account_achievements, allIds] = await Promise.all([
        apiClient("/v2/achievements/categories", `ids=all&v=2022-03-23T19:00:00.000Z`),
        apiClient("/v2/account", ""),
        apiClient("/v2/account/achievements", ""),
        apiClient("/v2/achievements", "")
    ]);
    account_achievements.forEach((x: any) => {
        x.bits_done = [...x.bits || []];
        delete x.bits;
    });
    return expandAchievements(account, categories, account_achievements, allIds);
};

const achievementsInfo = async (ids: string) => {
    return apiClient("/v2/achievements", "ids=" + ids);
};

const minis = async (ids: number[]) => {
    ids = ids.filter((x: number) => !itemsCache.has(x));
    const batches = [];
    do {
        let batch = ids.splice(0, 200);
        if (batch.length > 0) {
            batches.push(batch.join(","));
        }
    } while (ids.length > 0);
    if (batches.length) {
        const tasks = batches.map((ids) => apiClient("/v2/minis", "ids=" + ids));
        const resp = (await Promise.all(tasks)).flat();
        resp.forEach((x) => {
            if (x) {
                minisCache.set(x.id, x);
            }
        });
        await ls.set(MINIS_CACHE, [...minisCache.entries()]);
    }

}

const skins = async (ids: number[]) => {
    ids = ids.filter((x: number) => !skinsCache.has(x));
    const batches = [];
    do {
        let batch = ids.splice(0, 200);
        if (batch.length > 0) {
            batches.push(batch.join(","));
        }
    } while (ids.length > 0);
    if (batches.length) {
        const tasks = batches.map((ids) => apiClient("/v2/skins", "ids=" + ids));
        const resp = (await Promise.all(tasks)).flat();
        resp.forEach((x) => {
            if (x) {
                skinsCache.set(x.id, x);
            }
        });
        await ls.set(SKINS_CACHE, [...skinsCache.entries()]);
    }

}

const currencies = async (order: number[] = []) => {
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
    const _dep = depreciated.flatMap(({ reason, ids }) => ids.map(id => ({ depreciated: true, depreciationReason: reason, id, active: 0 })));
    const ignored = [74];
    const resp = await apiClient("/v2/currencies", `ids=all`);
    const _rawData = resp.filter((x: any) => !ignored.includes(x.id)).map((x: any) => ({ ...x, active: 1 }));
    const _data = mergeById(_rawData, _dep);
    _data.forEach(x => {
        const idx = order.findIndex(y => y == x.id)
        x.order = (idx >= 0) ? idx : x.depreciated ? x.order + 20000 : x.order + 10000;
    });
    return _data.sort((a, b) => a.order - b.order);
}

const wallet = async (order: number[] = []) => {
    const [_curr, _wallet] = await Promise.all([
        currencies(order),
        apiClient("/v2/account/wallet", "")
    ]);
    return mergeById(_curr, _wallet);
}



const delivery = async () => {
    const resp = await apiClient("/v2/commerce/delivery", "");
    const ids = resp.items.map((x: any) => x.id);
    resp.items = await expandItems(ids, resp.items);
    return resp;
};

const wizardVaultSorted = async (promise: Promise<any>) => {
    const resp = await promise;
    const byClaimed = Object.groupBy((resp.objectives || []) as any[], (x: any) => String(Boolean(x.claimed))) as Record<string, any[]>;
    byClaimed.false ??= [];
    byClaimed.true ??= [];
    resp.objectives = byClaimed.false.sort((a: any, b: any) => a.track.localeCompare(b.track) || a.title.localeCompare(b.title));
    resp.objectives.push(...byClaimed.true.sort((a: any, b: any) => a.track.localeCompare(b.track) || a.title.localeCompare(b.title)));
    return resp;
}

const wizardsVaultDaily = async () => {
    return wizardVaultSorted(apiClient("/v2/account/wizardsvault/daily", ""));
}

const wizardsVaultWeekly = async () => {
    return wizardVaultSorted(apiClient("/v2/account/wizardsvault/weekly", ""));
}

const wizardsVaultSpecial = async () => {
    return wizardVaultSorted(apiClient("/v2/account/wizardsvault/special", ""));
}

const init = async (newApiKey: string, options?: Partial<ApiClientOptions>) => {
    if (newApiKey === _apiKey && _tokenInfo) return;
    _items = await ls.getObject(ITEMS_CACHE, []);
    _achievements = await ls.getObject(ACHIEVEMENTS_CACHE, []);
    _minis = await ls.getObject(MINIS_CACHE, []);
    _skins = await ls.getObject(SKINS_CACHE, []);
    itemsCache = _items ? new Map(_items) : new Map();
    minisCache = _minis ? new Map(_minis) : new Map();
    skinsCache = _skins ? new Map(_skins) : new Map();
    achievementsCache = _achievements ? new Map(_achievements) : new Map();

    Logger.log("apiService.init", newApiKey);
    _apiKey = newApiKey;
    fetchOptions = Object.assign({}, fetchOptions, options);
    const _req = await ls.getObject(requestCacheName(), []);

    requestCache = _req.length ? new Map<string, CacheEntry>(_req) : new Map<string, CacheEntry>();
    await readSettings();
    try {
        _tokenInfo = await tokenInfo();
    } catch (error) {
        _tokenInfo.error = error instanceof Error ? error.message : String(error);
    }
    // console.log('tokenInfo', _tokenInfo)
};

const mergeById = (a1: any[], a2: any[]) => {
    return a1.filter((x) => x != undefined).map((t1) => ({ ...t1, ...a2.find((t2) => t2.id === t1.id) }));
};

const addPropertiesById = (base: any, details: any[]) => {
    const clone = JSON.parse(JSON.stringify(base));
    const match = details.find(x => x.id == base.id);
    // console.log('addPropertiesById', {clone, details})
    for (const key of Object.keys(match)) {
        if (key != 'id') {
            base[key] = match[key];
        }
    }
}

const expandItems = async (ids: Array<number>, collection: any[]) => {
    // get rid of nulls, invalid ids and duplicates
    ids = [...new Set(ids.filter((x) => x && !INVALID_ITEM_IDS.includes(x)))];
    const toFetch = ids.filter((x) => !itemsCache.has(x) && !inflightItems.has(x));
    const toAwait = ids.filter((x) => !itemsCache.has(x) && inflightItems.has(x));

    // Wait for any items already being fetched by another parallel call
    if (toAwait.length) {
        await Promise.all(toAwait.map(id => inflightItems.get(id))).catch(() => {});
    }

    // After awaiting, check which items are still missing (inflight call may have failed)
    const stillMissing = toAwait.filter((x) => !itemsCache.has(x));
    const allToFetch = [...toFetch, ...stillMissing];

    // Fetch items not yet in cache
    if (allToFetch.length) {
        const batches: string[] = [];
        const remaining = [...allToFetch];
        do {
            let batch = remaining.splice(0, 200);
            if (batch.length > 0) {
                batches.push(batch.join(","));
            }
        } while (remaining.length > 0);

        const fetchPromise = Promise.all(batches.map((ids) => items(ids))).then(results => results.flat());

        // Register each id as inflight
        for (const id of allToFetch) {
            inflightItems.set(id, fetchPromise);
        }

        try {
            const resp = await fetchPromise;
            resp.forEach((x) => {
                if (x) {
                    itemsCache.set(x.id, x);
                }
            });
            await ls.set(ITEMS_CACHE, [...itemsCache.entries()]);
        } finally {
            // Remove from inflight
            for (const id of allToFetch) {
                inflightItems.delete(id);
            }
        }
    }

    // All needed items should now be in cache — merge with collection
    const missingFromCache = ids.filter(x => !itemsCache.has(x));
    if (missingFromCache.length) {
        console.warn('expandItems: items NOT in cache after fetch:', missingFromCache);
    }
    const knownItems = ids.map((x) => itemsCache.get(x)).filter(x => x != null);
    const data = mergeById(collection, knownItems);
    const missingAfterMerge = data.filter(x => x.id && !x.name && !INVALID_ITEM_IDS.includes(x.id));
    if (missingAfterMerge.length) {
        console.warn('expandItems: items without name after merge:', missingAfterMerge.map(x => x.id), { collectionSize: collection.length, knownItemsSize: knownItems.length, idsSize: ids.length });
    }
    additionalMapping(data);

    return data;
};

const expandPrices = async (ids: Array<number>, collection: any[]) => {
    ids = ids.filter((x) => !INVALID_ITEM_IDS.includes(x));

    const data = [];
    const batches = [];
    do {
        let batch = ids.splice(0, 200);
        if (batch.length > 0) {
            batches.push(batch.join(","));
        }
    } while (ids.length > 0);
    if (batches.length) {
        const tasks = batches.map((ids) => prices(ids));
        const resp = (await Promise.all(tasks)).flat();
        data.push(...mergeById(collection, resp)); // have to merge based on collection, not list of prices because it otherwise ommits transactions with other asking price
    }
    return data;
};

const expandAchievements = async (account: any, categories: any[], accountAchievements: any[], allIds: number[]) => {
    Object.keys(ACHIEVEMENTS_NOT_IN_API).forEach((x: string) => {
        allIds.push(...(ACHIEVEMENTS_NOT_IN_API[x] || []));
    })

    const knownIds = [...achievementsCache.keys()];
    const _doneIds = accountAchievements.filter((x: any) => x.done === true).map((x: any) => x.id);
    const _notDone = allIds.filter((x: number) => !_doneIds.includes(x));
    const missingIds = allIds.filter((x: number) => !INVALID_ACHIEVEMENTS_IDS.includes(x) && !knownIds.includes(x));

    // prepare list of ids to request in batches of 200 max
    const batches = [];
    do {
        let batch = missingIds.splice(0, 200);
        if (batch.length > 0) {
            batches.push(batch.join(","));
        }
    } while (missingIds.length > 0);

    if (batches.length) {
        // and make requests in parallel
        const tasks = batches.map((ids) => achievementsInfo(ids));
        const resp = (await Promise.all(tasks)).filter(x => wxjs_types.isArray(x)).flat();
        const itemIds: number[] = [];
        const skinIds: number[] = [];
        const miniIds: number[] = [];
        resp.forEach(async (x: any) => {
            if (x) {
                x.description = toHtml(x.description)
                if (x.type == 'ItemSet' && x.bits) {

                    itemIds.push(...(x.bits.filter((xx: any) => xx.type == "Item").map((xxx: any) => xxx.id)));
                    skinIds.push(...(x.bits.filter((xx: any) => xx.type == "Skin").map((xxx: any) => xxx.id)));
                    miniIds.push(...(x.bits.filter((xx: any) => xx.type == "Minipet").map((xxx: any) => xxx.id)));
                }
                achievementsCache.set(x.id, x);
            }
        });
        // store updated achievs in localStorage for future
        await ls.set(ACHIEVEMENTS_CACHE, [...achievementsCache.entries()]);
        mergeById(resp, accountAchievements);
        await expandItems(itemIds, itemIds.map((x: number) => ({ id: x })));
        console.log('expanding minis from achieves...', miniIds);
        await minis(miniIds);
        console.log('expanding skins from achieves...', skinIds);
        await skins(skinIds);
    }

    let _log = '';

    // we don't want categories of achievements that are not obtainable anymore
    const ignored_achievements = [...INACTIVE_ACHIEVEMENTS_CATEGORIES];
    // so we also ignore seasonal ones (appart from current season ofc)
    // console.log('current season:', _settings.currentSeason)
    Object.keys(SEASONAL_ACHIEVEMENTS_CATEGORIES).forEach((season: string) => {
        if (season != _settings.currentSeason) {
            ignored_achievements.push(...SEASONAL_ACHIEVEMENTS_CATEGORIES[season as keyof typeof SEASONAL_ACHIEVEMENTS_CATEGORIES]);
        }
    })

    const achievsInCategories: number[] = [];
    const noCategory: number[] = [];
    categories.forEach((cat: any) => {
        achievsInCategories.push(...cat.achievements.map((x: any) => x.id));
    });
    allIds.forEach((id: number) => {
        if (!ignored_achievements.includes(id) && !achievsInCategories.includes(id)) {
            noCategory.push(id)
        }
    });
    // console.log('noCategory', noCategory);

    categories.push({
        id: 0,
        name: "__MISSING__",
        description: "Achievements with no category",
        icon: "/gw2helper/assets/rewards/Daily_Achievement.png",
        achievements: noCategory.map((x: number) => ({ id: x }))
    });

    categories.forEach((cat: any) => {
        // if (ACHIEVEMENTS_NOT_IN_API[cat.id]) {
        //     const tmp = cat.achievements;
        //     tmp.push(...(ACHIEVEMENTS_NOT_IN_API[cat.id].map(x => ({ id: x }))));
        //     cat.achievements = unique(tmp);
        // }
        _log += `${cat.id}, // ${cat.name}\n`;
        cat.ignore = (ignored_achievements.includes(cat.id)) ? true : false;
        cat.achievements = cat.achievements.map((x: any) => {
            let achiev = achievementsCache.get(x.id);
            if (!achiev) {
                console.warn('achiev Id not found', x.id);
                achiev = x;
            }
            const mine = accountAchievements.find((acv: any) => acv.id == x.id) || {
                id: x.id,
                current: 0,
                repeated: 0,
                bits_done: [],
                done: false,
                max: achiev.bits != undefined ? achiev.bits.length : 0,
            };
            mine.repeated ??= 0;
            let points_per_tier = 0;
            let points_done = 0;
            let points_to_get = 0;

            if (achiev.tiers) {
                const tiers_done = achiev.tiers.filter((t: any) => t.count <= mine.current);
                const tiers_todo = achiev.tiers.filter((t: any) => t.count > mine.current);
                points_per_tier = sum(achiev.tiers, 'points');
                points_done = points_per_tier * mine.repeated + sum(tiers_done, 'points');
                if (achiev.point_cap && (achiev.point_cap < points_done)) {
                    points_done = achiev.point_cap;
                }
                points_to_get = (achiev.point_cap && (points_done >= achiev.point_cap)) ? 0 : sum(tiers_todo, 'points');
            }
            achiev.rewardsObj = achiev.rewards ? Object.groupBy(achiev.rewards as any[], (x: any) => x.type.toLowerCase()) : {};
            achiev.icon ??= cat.icon;

            return {
                ...achiev,
                ...mine,
                points_per_tier,
                points_done,
                points_to_get,
            }
        });
        // missing 
        if (cat.id == 0) {
            // console.log('missing...')
            // remove daily and weekly from missing achievements
            cat.achievements = cat.achievements.filter((x: any) => !(x.flags.includes('Daily') || x.flags.includes('Weekly')));
            // console.log('missing', cat.achievements)
        }
        cat.points_to_get = sum(cat.achievements, 'points_to_get');
        cat.points_done = sum(cat.achievements, 'points_done');
        cat._rewards_to_get = cat.achievements.filter((x: any) => !x.done && x.rewards).flatMap((x: any) => x.rewards)
        // aggregating and mapping from array of objects to object with nested arrays of objects, group by 'type' field
        // cat.rewards = Object.groupBy(cat_rewards, x => x.type.toLowerCase())
        // cat.titles_to_get = cat.achievements.filter(x => !x.done && x.rewardsObj.title).length;
        // cat.items_to_get = cat.achievements.filter(x => !x.done && x.rewardsObj.item).length;

        cat.rewards_to_get = new Map();
        sumRewards(cat.rewards_to_get, cat._rewards_to_get);
        // cat.mastery_to_get.Tyria = cat.achievements.filter(x => !x.done && x.rewardsObj.item && x.rewardsObj.item.find(y => y.region == 'Tyria')).length;
    })

    // console.log('achiev ids:', _log);

    // get all masteries for dev purposes
    // const tmp = categories.map(c => c.rewards.mastery).filter(x => x != undefined).flat(true).map((x => x.region))
    // console.log('masteries', [... new Set(tmp)])

    const rewards_to_get = new Map();

    categories.forEach((x: any) => {
        sumRewards(rewards_to_get, x._rewards_to_get)
    });

    return {
        completed: _doneIds.length,
        todo: _notDone.length,
        daily_ap: account.daily_ap,
        monthly_ap: account.monthly_ap,
        categories,
        rewards_to_get,
    }
};

const toHtml = (text: string | null): string => {
    let descr = text || '';
    descr = descr.replace('<c=@Flavor>', '<span class="flavor">');
    descr = descr.replace('<c=@flavor>', '<span class="flavor">');
    descr = descr.replace('<c=@Warning>', '<span class="warning">');
    descr = descr.replace('<c=@warning>', '<span class="warning">');
    descr = descr.replace('</c>', '</span>');
    return descr;
}

const additionalMapping = (data: any[]) => {
    data.forEach((element: any) => {
        if (element.charges) {
            element.count = element.charges;
        }
        element.description = toHtml(element.description);
        if (element.details) {
            if (element.details.type) {
                element.subtype = element.details.type;
            }
            if (element.details.description) {
                element.subdescr = toHtml(element.details.description);
            }
        }
    });
};

const clearCache = async () => {
    Logger.log('clearing cache...');
    await ls.delete(requestCacheName());
    await ls.delete(ITEMS_CACHE);
    await ls.delete(MINIS_CACHE);
    await ls.delete(SKINS_CACHE);
    await ls.delete(ACHIEVEMENTS_CACHE);
    await ls.delete(KEY_HIST);
    itemsCache.clear();
    achievementsCache.clear();
    requestCache.clear();
    minisCache.clear();
    skinsCache.clear();
    inflightItems.clear();
}

const getApiKey = () => {
    return _apiKey;
}

export default {
    getApiKey,
    init,
    characters,
    charactersItems,
    sharedInventory,
    bank,
    items,
    account,
    guildItems,
    materials,
    achievements,
    guilds,
    currencies,
    wallet,
    clearCache,
    getFromAchievementsCache,
    delivery,
    wizardsVaultDaily,
    wizardsVaultWeekly,
    wizardsVaultSpecial,
    transactionsCurrent,
    legendaries,
    startSession: () => {
        _tokenInfo.missingScopes = [];
    },
    tokenInfo: () => _tokenInfo,
    itemsCache: (id: string | number) => itemsCache.get(parseInt(String(id))),
    minisCache: (id: string | number) => minisCache.get(parseInt(String(id))),
    skinsCache: (id: string | number) => skinsCache.get(parseInt(String(id))),
    achievementsCache: (id: string | number) => achievementsCache.get(parseInt(String(id))),
    currentSeason: () => _settings.currentSeason,
    wizardsVault: () => _settings.wizardsVault,
};
