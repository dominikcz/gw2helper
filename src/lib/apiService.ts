import Logger from "./logger";
import ls from "./wxjs_idb";
import wx from "./wxjs_types";
import { ACHIEVES_CACHE, ITEMS_CACHE, KEY_HIST, REQUESTS_CACHE } from "$lib/consts";
import { sum, getQueryStringFlag } from "./utils";
import wxjs_types from "./wxjs_types";

const defaultApiUrl = "https://api.guildwars2.com";
const mockApiUrl = "http://localhost:3000";
const CACHE_TIMEOUT = 15 * 60;
const INVALID_IDS: number[] = [4589, 21083, 21242, 39350, 39351, 39352, 39353, 39354, 39355, 39356, 39748, 39749, 42424, 42426, 43353, 82854, 97730, 78599, 101651];
const INVALID_ACHIEVES_IDS: number[] = [];
const ACHIEVES_NOT_IN_API = {
    // Rift Hunting
    // TODO: will have to change to list of objects and get achieves' descriptions from wiki :(
    // 361: [7661, 7080, 7697, 7615, 7700, 7637, 7729, 7632, 7723, 7674, 7235, 7228, 7007, 7123, 7142, 7635],
}

let INACTIVE_ACHIEVES_CATEGORIES = [22, 45, 46, 73, 79, 98, 162, 191, 193, 197, 200, 201, 205, 212, 213, 214, 228, 230, 231, 232, 233, 238, 243, 257, 262, 263, 342, 365, 267, 268, 270, 271, 272, 273, 274, 275, 276, 278, 280, 281, 282, 351, 393, 400];

const unique = function (tab) {
    return tab.filter(function (el, i, self) {
        return self.indexOf(el) === i;
    });
};

const SCHEMA_VERSION = '2019-12-19T00:00:00.000Z'; // or 'latest'?

const ignoreCache = getQueryStringFlag('ignore-cache');
const devMode = getQueryStringFlag('dev-mode');
const realApi = getQueryStringFlag('real-api');
    

interface CacheEntry {
    time: Date | string;
    timeout: number;
    data: object;
}

let _items;
let _achieves;
let itemsCache;
let achievesCache;
let requestCache: Map<string, CacheEntry>;

let _apiKey = "";
let fetchOptions = {
    method: "GET",
    baseURL: devMode ? realApi ? defaultApiUrl : mockApiUrl : defaultApiUrl,
    timeout: 10000,
    expectJson: true,
    onError(request, response, options) {
        Logger.error(`apiClient response error ${response.status}: ${response.statusText ? response.statusText : '(HTTP status: ' + response.status + ')'} \n req: ${JSON.stringify(request)}, options: ${JSON.stringify(options)}`, response);
    },
    fetchFunction: fetch,
    debug: false,
};

const requestCacheName = (): string => {
    return `${REQUESTS_CACHE}.${_apiKey}`;
}

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

const cacheRequest = async (req: string, value: any) => {
    const obj = {
        time: new Date(),
        data: value,
    };
    requestCache.set(req, obj);
    await ls.set(requestCacheName(), [...requestCache.entries()]);
};

const getFromAchievesCache = (key: string): object => {
    return achievesCache.get(key);
}

const apiClient = async (req: string | RequestInfo, query: string, options?: object) => {
    if (!_apiKey) {
        Logger.error('not initialized, please provide api key from https://account.arena.net');
        return null;
    }
    const origReq = req + query;
    const _options = Object.assign({}, fetchOptions, options);
    let cachedValue = !ignoreCache ? tryCache(origReq) : undefined;
    if (cachedValue !== undefined) {
        Logger.log("requestCache is valid, returning cached response");
        return cachedValue;
    } else {
        Logger.log("requestCache is INVALID, refreshing...");

        if (typeof req == "string") {
            req = _options.baseURL + req;
        }

        if (_options.debug) {
            Logger.log(`req: ${req}, options: `, _options);
        }
        const response = await _options.fetchFunction(`${req}?access_token=${_apiKey}${query ? "&" : ""}${query}`, _options).catch(error => {
            Logger.error('error', error);
        });
        if (response.status >= 400) {
            const body = await response.text();
            Logger.warn('error loading data', { status: response.status, url: response.url, body });
            // notifyOnError(req, response, _options);
            cachedValue = body || [];
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
    return promiseMe(apiClient("/v2/characters", "ids=all"), async (rawData) => {
        const tasks = [];
        for (const char of rawData) {
            let bags = char.bags.map(x => ({ id: x.id, size: x.size, count: 1 }));
            let itemsInBags = char.bags
                .filter(x => x != null)
                .map((bag) => bag.inventory)
                .flat()
                .filter((x) => x != null);
            let equipment = char.equipment.flat().filter(x => x != null).map(x => ({ ...x, count: 1 }));
            let charItems = bags.concat(itemsInBags).concat(equipment);
            let ids = charItems.map(x => x.id);
            char._items = await expandItems(ids, charItems);
        }
        return rawData;
    });
};

const materials = async () => {
    return promiseMe(apiClient("/v2/account/materials", ""), async (rawData) => {
        let ids = rawData.map((x) => x.id);
        return expandItems(ids, rawData);
    })
};

const _getGuilds = async (full: boolean = false) => {
    return promiseMe(apiClient("/v2/account", ""), async (account) => {
        // concat and remove duplicates
        const _guilds = [...new Set([...account.guild_leader, ...account.guilds])];

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
                x.emblem ??= defEmblem
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
    })
}

const guildItems = async () => {
    const items = [];
    return promiseMe(_getGuilds(false), async (guilds) => {
        for (const guild of guilds) {
            let stashRaw = await apiClient(`/v2/guild/${guild.id}/stash`, "");
            if (!wxjs_types.isArray(stashRaw)) {
                continue;
            }
            stashRaw = stashRaw
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
    })
};

const characters = async () => {
    return promiseMe(apiClient("/v2/characters", "ids=all"), (resp) => {
        return resp.map(x => ({ ...x, crafting_discipline: x.crafting.map(c => c.discipline).flat().join(', ') }));
    })
};

const guilds = async () => {
    return _getGuilds(true);
};

const items = (x: string) => {
    return apiClient("/v2/items", "ids=" + x);
};

const account = () => {
    return new Promise((resolve) => {
        Promise.all([apiClient("/v2/account", `v=${SCHEMA_VERSION}`), wallet()]).then(([_acc, _wal]) => {
            // console.log('acc', {_acc, _wal})
            _acc.created_local = new Date(_acc.created).toLocaleString();
            _acc.last_modified_local = new Date(_acc.last_modified).toLocaleString();

            resolve(_acc)
        });
    });
};

const sharedInventory = async () => {
    return promiseMe(apiClient("/v2/account/inventory", ""), (resp) => {
        // this endpoint returns null in "empty" slots and we don't want that
        const rawData = resp.filter((x) => x != null);
        const ids = rawData.map((x) => x.id);
        return expandItems(ids, rawData);
    });
};

const bank = async () => {
    return promiseMe(apiClient("/v2/account/bank", ""), (resp) => {
        // this endpoint returns null in "empty" slots and we don't want that
        const rawData = resp.filter((x) => x != null);
        const ids = rawData.map((x) => x.id);
        return expandItems(ids, rawData);
    });
};

const tokenInfo = async () => {
    return apiClient("/v2/tokeninfo", "").catch(reason => {
        console.log('reason', reason)
    });
};

const achievements = async (all: boolean = false) => {
    return new Promise((resolve) => {
        Promise.all([
            apiClient("/v2/achievements/categories", "ids=all&v=2022-03-23T19:00:00.000Z"),
            apiClient("/v2/account", ""),
            apiClient("/v2/account/achievements", ""),
            apiClient("/v2/achievements", "")])
            .then(([categories, account, account_achieves, allIds]) => {
                account_achieves.forEach(x => {
                    x.bits_done = x.bits || [];
                    delete x.bits;
                });
                resolve(expandAchieves(account, categories, account_achieves, allIds));
            });
    });
};

const achievementsInfo = async (ids: string) => {
    return apiClient("/v2/achievements", "ids=" + ids);
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
    const _dep = depreciated.flatMap(({ reason, ids }) => ids.map(id => ({ depreciated: true, depreciationReason: reason, id, active: 0 })));
    const ignored = [74];
    return promiseMe(apiClient("/v2/currencies", "ids=all"), (resp) => {
        const _rawData = resp.filter(x => !ignored.includes(x.id)).map(x => ({ ...x, active: 1 }));
        return mergeById(_rawData, _dep);
    })
}

const wallet = async () => {
    return new Promise((resolve) => {
        Promise.all([currencies(), apiClient("/v2/account/wallet", "")]).then(([_curr, _wallet]) => {
            resolve(mergeById(_curr, _wallet))
        });
    });
}

const promiseMe = async (APromise: Promise<any>, job) => {
    return new Promise((resolve, reject) => {
        APromise.then(async (resp) => {
            const jobRes = job(resp);
            if (jobRes) {
                resolve(jobRes);
            } else {
                reject();
            }
        });
    });
};

const delivery = async () => {
    return promiseMe(apiClient("/v2/commerce/delivery", ""), async (resp) => {
        const ids = resp.items.map(x => x.id);
        resp.items = await expandItems(ids, resp.items);
        return resp;
    });
};

const wizardVaultSorted = (APromise: Promise<any>, job) => {
    return promiseMe(APromise, async (resp) => {
        const byClaimed = Object.groupBy(resp.objectives, x => x.claimed);
        byClaimed.false ??= [];
        byClaimed.true ??= [];
        resp.objectives = byClaimed.false.sort((a, b) => a.track.localeCompare(b.track) || a.title.localeCompare(b.title));
        resp.objectives.push(...byClaimed.true.sort((a, b) => a.track.localeCompare(b.track) || a.title.localeCompare(b.title)));
        return resp;
    });
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

const init = async (newApiKey: string, options?: object) => {
    _items = await ls.getObject(ITEMS_CACHE, []);
    _achieves = await ls.getObject(ACHIEVES_CACHE, []);
    itemsCache = _items ? new Map(_items) : new Map();
    achievesCache = _achieves ? new Map(_achieves) : new Map();

    Logger.log("apiService.init", newApiKey);
    _apiKey = newApiKey;
    fetchOptions = Object.assign({}, fetchOptions, options);
    const _req = await ls.getObject(requestCacheName(), []);

    requestCache = _req.length ? new Map<string, CacheEntry>(_req) : new Map<string, CacheEntry>();
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
    const alreadyKnown = ids.filter((x) => knownIds.includes(x)).map((x) => itemsCache.get(x));

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
        await ls.set(ITEMS_CACHE, [...itemsCache.entries()]);
        data.push(...mergeById(resp, collection));
    }
    if (alreadyKnown.length) {
        data.push(...mergeById(alreadyKnown, collection));
    }
    additionalMapping(data);

    return data;
};

const sumRewards = (rewardsToGet, rewards) => {
    rewards.forEach(x => {
        const key = (x.region ? `${x.type}_${x.region}` : x.type).toLowerCase();
        const old = rewardsToGet.get(key) || 0;
        rewardsToGet.set(key, old + (x.count || 1))
    });
}

const expandAchieves = async (account, categories, accountAchieves, allIds) => {
    Object.keys(ACHIEVES_NOT_IN_API).forEach(x => {
        allIds.push(...(ACHIEVES_NOT_IN_API[x]));
    })

    const knownIds = [...achievesCache.keys()];
    const _doneIds = accountAchieves.filter(x => x.done === true).map(x => x.id);
    const _notDone = allIds.filter(x => !_doneIds.includes(x));
    const missingIds = allIds.filter((x) => !INVALID_ACHIEVES_IDS.includes(x) && !knownIds.includes(x));

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
        resp.forEach((x) => {
            if (x) {
                x.description = toHtml(x.description)
                achievesCache.set(x.id, x);
            }
        });
        // store updated achievs in localStorage for future
        await ls.set(ACHIEVES_CACHE, [...achievesCache.entries()]);
        mergeById(resp, accountAchieves);
    }

    categories.forEach(cat => {
        // if (ACHIEVES_NOT_IN_API[cat.id]) {
        //     const tmp = cat.achievements;
        //     tmp.push(...(ACHIEVES_NOT_IN_API[cat.id].map(x => ({ id: x }))));
        //     cat.achievements = unique(tmp);
        // }
        cat.ignore = (INACTIVE_ACHIEVES_CATEGORIES.includes(cat.id)) ? true : false;
        cat.achievements = cat.achievements.map(x => {
            let achiev = achievesCache.get(x.id);
            if (!achiev) {
                console.warn('achiev Id not found', x.id);
                achiev = x;
            }
            const mine = accountAchieves.find(acv => acv.id == x.id) || {
                id: x.id,
                current: 0,
                repeated: 0,
                bits_done: [],
                done: false
            };
            mine.repeated ??= 0;
            let points_per_tier: number | null = null;
            let points_done: number | null = null;
            let points_to_get: number | null = null;

            if (achiev.tiers) {
                const tiers_done = achiev.tiers.filter(t => t.count <= mine.current);
                const tiers_todo = achiev.tiers.filter(t => t.count > mine.current);
                points_per_tier = sum(achiev.tiers, 'points');
                points_done = points_per_tier * mine.repeated + sum(tiers_done, 'points');
                if (achiev.point_cap && (achiev.point_cap < points_done)) {
                    points_done = achiev.point_cap;
                }
                points_to_get = (achiev.point_cap && (points_done >= achiev.point_cap)) ? 0 : sum(tiers_todo, 'points');
            }
            achiev.rewardsObj = achiev.rewards ? Object.groupBy(achiev.rewards, x => x.type.toLowerCase()) : {};
            achiev.icon ??= cat.icon;

            return {
                ...achiev,
                ...mine,
                points_per_tier,
                points_done,
                points_to_get,
            }
        });
        cat.points_to_get = sum(cat.achievements, 'points_to_get');
        cat.points_done = sum(cat.achievements, 'points_done');
        cat._rewards_to_get = cat.achievements.filter(x => !x.done && x.rewards).flatMap(x => x.rewards)
        // aggregating and mapping from array of objects to object with nested arrays of objects, group by 'type' field
        // cat.rewards = Object.groupBy(cat_rewards, x => x.type.toLowerCase())
        // cat.titles_to_get = cat.achievements.filter(x => !x.done && x.rewardsObj.title).length;
        // cat.items_to_get = cat.achievements.filter(x => !x.done && x.rewardsObj.item).length;

        cat.rewards_to_get = new Map();
        sumRewards(cat.rewards_to_get, cat._rewards_to_get);
        // cat.mastery_to_get.Tyria = cat.achievements.filter(x => !x.done && x.rewardsObj.item && x.rewardsObj.item.find(y => y.region == 'Tyria')).length;
    })
    // get all masteries for dev purposes
    // const tmp = categories.map(c => c.rewards.mastery).filter(x => x != undefined).flat(true).map((x => x.region))
    // console.log('masteries', [... new Set(tmp)])

    const rewards_to_get = new Map();

    categories.forEach(x => {
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
    descr = descr.replace('<c=@Warning>', '<span class="warning">');
    descr = descr.replace('</c>', '</span>');
    return descr;
}

const additionalMapping = (data) => {
    data.forEach((element) => {
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
    await ls.delete(ACHIEVES_CACHE);
    await ls.delete(KEY_HIST);
    itemsCache.clear();
    achievesCache.clear();
    requestCache.clear();
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
    tokenInfo,
    achievements,
    guilds,
    currencies,
    wallet,
    clearCache,
    getFromAchievesCache,
    delivery,
    wizardsVaultDaily,
    wizardsVaultWeekly,
    wizardsVaultSpecial,
};
