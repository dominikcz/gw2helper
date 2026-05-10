import Logger from "./logger";
import ls from "./wxjs_idb";
import wx from "./wxjs_types";
import { ACHIEVEMENTS_CACHE, ITEMS_CACHE, KEY_HIST, MINIS_CACHE, REQUESTS_CACHE, SKINS_CACHE } from "$lib/consts";
import { sum, getQueryStringFlag } from "./utils";
import wxjs_types from "./wxjs_types";
import { INACTIVE_ACHIEVEMENTS_CATEGORIES, SEASONAL_ACHIEVEMENTS_CATEGORIES, sumRewards } from "./components/achievements/achievements";
import { groupBy, mapFields } from "./utils/helper-utils";
import wxdates from "./wxjs_dates";
import type { AchievementBit } from "$lib/types/achievements";
import type { ItemTooltipData } from "$lib/types/items";
import type {
    AccountWithLocalDates,
    ApiAccountAchievementDto,
    ApiAccountDto,
    ApiAchievementCategoryDto,
    ApiAchievementDto,
    ApiAchievementRewardDto,
    ApiCharacterBagDto,
    ApiCharacterCraftingDto,
    ApiCharacterDto,
    ApiCommerceDeliveryDto,
    ApiCommercePriceDto,
    ApiCommercePriceOfferDto,
    ApiCommerceTransactionDto,
    ApiCurrencyDto,
    ApiGuildDto,
    ApiGuildStashSectionDto,
    ApiItemDto,
    ApiLegendaryArmoryDto,
    ApiAccountLegendaryArmoryDto,
    ApiMiniDto,
    ApiSkinDto,
    ApiWalletDto,
    CharacterWithItems,
    DeliveryData,
    ExpandedItem,
    GuildStashData,
    LegendariesData,
    LegendaryItemSummary,
    TransactionCurrentItem,
    WalletCurrency,
    WizardsVaultCategoryData,
} from "$lib/types/gw2-api";
import type { AchievementsData } from "$lib/components/achievements/achievements";

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
    data: unknown;
}

type Dictionary = Record<string, unknown>;

type ApiListItem = {
    id: number;
    [key: string]: unknown;
};

type ItemLike = ApiItemDto & ItemTooltipData & {
    id: number;
    details?: { type?: string; description?: string } & Dictionary;
    upgrades?: number[];
    infusions?: number[];
    charges?: number;
    subtype?: string;
    subdescr?: string;
    [key: string]: unknown;
};

type CharacterBag = ApiCharacterBagDto;

type CharacterData = ApiCharacterDto & {
    bags?: Array<CharacterBag | null>;
    equipment?: Array<ItemLike | null>;
    crafting?: Array<ApiCharacterCraftingDto | null>;
    _items?: ExpandedItem[];
    [key: string]: unknown;
};

type TransactionData = ApiCommerceTransactionDto;

type TransactionExpanded = TransactionData & {
    transId: number;
    id: number;
    count: number;
};

type AchievementReward = ApiAchievementRewardDto;

type AchievementTier = {
    count: number;
    points?: number;
};

type AchievementData = ApiAchievementDto & {
    bits?: AchievementBit[];
    tiers?: AchievementTier[];
    rewards?: AchievementReward[];
    rewardsObj?: Partial<Record<string, AchievementReward[]>>;
    [key: string]: unknown;
};

type AchievementCategoryData = Omit<ApiAchievementCategoryDto, 'achievements'> & {
    ignore?: boolean;
    name: string;
    description?: string;
    achievements: AchievementData[];
    points_to_get?: number;
    points_done?: number;
    _rewards_to_get?: AchievementReward[];
    rewards_to_get?: Map<string, number>;
};

type AccountAchievementData = ApiAccountAchievementDto & {
    bits?: number[];
    bits_done?: number[];
    [key: string]: unknown;
};

type AccountData = ApiAccountDto & {
    created_local?: string;
    last_modified_local?: string;
    [key: string]: unknown;
};

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
    transform?: (data: unknown) => unknown;
}

let _items: [number, ItemLike][] | undefined;
let _minis: [number, ApiMiniDto][] | undefined;
let _skins: [number, ApiSkinDto][] | undefined;
let _achievements: [number, AchievementData][] | undefined;
let itemsCache: Map<number, ItemLike>;
let minisCache: Map<number, ApiMiniDto>;
let skinsCache: Map<number, ApiSkinDto>;
let achievementsCache: Map<number, AchievementData>;
let requestCache: Map<string, CacheEntry>;
let inflightItems: Map<number, Promise<ItemLike[]>> = new Map();
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

const cacheRequest = async (req: string, value: unknown) => {
    const obj: CacheEntry = {
        time: new Date(),
        timeout: CACHE_TIMEOUT,
        data: value,
    };
    requestCache.set(req, obj);
    await ls.set(requestCacheName(), [...requestCache.entries()]);
};

const getFromAchievementsCache = (key: string): AchievementData | undefined => {
    return achievementsCache.get(Number(key));
}

const readSettings = async () => {
    const response = await fetchOptions.fetchFunction('/gw2helper_settings.json').catch(error => {
        Logger.error('error loading settings', error);
    });

    if (response?.ok) {
        const contentType = (response.headers.get('content-type') || '').toLowerCase();
        const isJson = contentType.includes('application/json');

        if (!isJson) {
            Logger.warn('settings file missing or non-json response, using defaults', {
                status: response.status,
                url: response.url,
                contentType,
            });
        } else {
            try {
                const data = await response.json();
                if (wxjs_types.isObject(data)) {
                    _settings = Object.assign({}, _settings, data);
                } else {
                    Logger.warn('invalid settings payload, using defaults', {
                        payloadType: typeof data,
                    });
                }
            } catch (error) {
                Logger.warn('could not parse settings json, using defaults', {
                    error: error instanceof Error ? error.message : String(error),
                    status: response.status,
                    url: response.url,
                });
            }
        }
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

const apiClient = async <T = unknown>(req: string | RequestInfo, query: string, options?: Partial<ApiClientOptions>): Promise<T> => {
    if (!_apiKey) {
        Logger.error('not initialized, please provide api key from https://account.arena.net');
        return null as unknown as T;
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
        return cacheEntry.data as T;
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
        return data as T;
    }

    Logger.warn(`got response.status = ${response?.status} for ${origReq}... returning empty`);
    return (query ? [] : {}) as T;
};

const charactersItems = async (): Promise<CharacterWithItems[]> => {
    const rawData: CharacterData[] = (await apiClient<CharacterData[]>("/v2/characters", "ids=all")) || [];
    for (const char of rawData) {
        let bags = (char.bags || []).filter((x): x is CharacterBag => x != null).map((x) => ({ id: x.id, count: 1 }));
        let itemsInBags = (char.bags || [])
            .filter((x): x is CharacterBag => x != null)
            .map((bag) => bag.inventory)
            .flat()
            .filter((x): x is ItemLike => x != null);
        let equipment = (char.equipment || []).flat().filter((x): x is ItemLike => x != null).map((x) => ({ ...x, count: 1, equipped: true }));
        let charItems: ItemLike[] = [...bags, ...itemsInBags, ...equipment];
        const addons: number[] = [];
        charItems.forEach((x) => {
            addons.push(...(x.upgrades || []), ...(x.infusions || []));
        })
        charItems.push(...addons.map((x: number) => ({ id: x, count: 1, equipped: true })))
        let ids: number[] = charItems.map((x) => x.id);
        char._items = (await expandItems(ids, charItems)) as ExpandedItem[];
    }
    return rawData as CharacterWithItems[];
};

const materials = async (): Promise<ExpandedItem[]> => {
    const rawData: ItemLike[] = (await apiClient<ItemLike[]>("/v2/account/materials", "")) || [];
    const ids: number[] = rawData.map((x) => x.id);
    return (await expandItems(ids, rawData)) as ExpandedItem[];
};


function sumQuantities(data: TransactionExpanded[]): TransactionExpanded[] {
    // for more general function use sumGroupBy from utils.js
    return Object.values(data.reduce((result: Record<string, TransactionExpanded>, item) => {
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

const _getTransactions = async (_transactions: TransactionData[]): Promise<TransactionCurrentItem[]> => {
    const transactions: TransactionExpanded[] = _transactions.map((x) => ({
        ...x,
        transId: x.id,
        id: x.item_id,
        count: x.quantity,

    }));


    const ids: number[] = transactions.map((x) => x.id);

    // let sum = sumGroupBy(exp, ['item_id', 'price'], 'count')
    let sum = sumQuantities(transactions);
    sum = await expandItems(ids, sum);
    sum = await expandPrices(ids, sum);
    // console.log('sum', sum, transactions)
    return sum as TransactionCurrentItem[];
}

const transactionsCurrent = async (): Promise<{ buys: TransactionCurrentItem[]; sells: TransactionCurrentItem[] }> => {
    const [_buys, _sells] = await Promise.all([
        apiClient<TransactionData[]>("/v2/commerce/transactions/current/buys", ""),
        apiClient<TransactionData[]>("/v2/commerce/transactions/current/sells", "")
    ]);
    const [buys, sells] = await Promise.all([
        _getTransactions(_buys),
        _getTransactions(_sells)
    ]);
    return { buys, sells };
}

const _getGuilds = async (full: boolean = false): Promise<ApiGuildDto[]> => {
    const account = await apiClient<AccountData>("/v2/account", "");
    // concat and remove duplicates
    const _guilds = [...new Set([...(account.guild_leader || []), ...(account.guilds || [])])];

        let tasks: Array<Promise<ApiGuildDto>> = [];
        for (const guild of _guilds) {
            tasks.push(apiClient<ApiGuildDto>(`/v2/guild/${guild}`, ""));
        }
        let _rawData: ApiGuildDto[] = (await Promise.all(tasks)).flat();
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
            _rawData.forEach((x) => {
                x.emblem ??= defEmblem
            });
            const _emblems = _rawData.map((x) => x.emblem as { background: { id: number; colors: Array<number | { id: number }> }; foreground: { id: number; colors: Array<number | { id: number }> } });
            const fgs: number[] = [];
            const bgs: number[] = [];
            let clrs: number[] = [];

            // console.log('emblems', _emblems);
            for (const emblem of _emblems) {
                bgs.push(emblem.background.id);
                fgs.push(emblem.foreground.id);
                clrs.push(...emblem.background.colors.map((x) => wx.isObject(x) ? Number((x as { id: number }).id) : Number(x)));
                clrs.push(...emblem.foreground.colors.map((x) => wx.isObject(x) ? Number((x as { id: number }).id) : Number(x)));
            }
            clrs = [...new Set(clrs)].filter(x => x != null);
            const [colors, foregrounds, backgrounds] = await Promise.all([
                clrs.length ? apiClient<Array<ApiListItem & { id: number }>>('/v2/colors', "ids=" + clrs.join(',')) : Promise.resolve([]),
                apiClient<Array<ApiListItem & { id: number }>>('/v2/emblem/foregrounds', "ids=" + fgs.join(',')),
                apiClient<Array<ApiListItem & { id: number }>>('/v2/emblem/backgrounds', "ids=" + bgs.join(','))
            ]);
            for (const item of _rawData) {
                const emblem = item.emblem as {
                    foreground: { colors: Array<number | { id: number } | undefined> } & Dictionary;
                    background: { colors: Array<number | { id: number } | undefined> } & Dictionary;
                } | undefined;
                if (emblem) {
                    addPropertiesById(emblem.foreground, foregrounds);
                    addPropertiesById(emblem.background, backgrounds);
                    emblem.foreground.colors = emblem.foreground.colors.map((color) => colors.find((x) => Number(color) == x.id) ?? color);
                    emblem.background.colors = emblem.background.colors.map((color) => colors.find((x) => Number(color) == x.id) ?? color);
                }
            }
            // console.log('emblems', {bgs, fgs, clrs});
            // console.log('emblems data', _rawData)
        }
    return _rawData;
}

const guildItems = async (): Promise<GuildStashData[]> => {
    const items: GuildStashData[] = [];
    const guilds = await _getGuilds(false);
    for (const guild of guilds) {
        try {
            let stashRaw: unknown = await apiClient<unknown>(`/v2/guild/${guild.id}/stash`, "");
            if (!wxjs_types.isArray(stashRaw)) {
                continue;
            }
            const normalizedStashRaw = (stashRaw as ApiGuildStashSectionDto[])
                .map((x) => x.inventory as ItemLike[] | null | undefined)
                .flat()
                .filter((x: ItemLike | null | undefined): x is ItemLike => x != null);
            const ids = normalizedStashRaw.map((x) => x.id);
            items.push({
                name: guild.name,
                stash: (await expandItems(ids, normalizedStashRaw)) as ExpandedItem[],
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

const characters = async (): Promise<Array<ApiCharacterDto & { crafting_discipline: string }>> => {
    const resp: CharacterData[] = (await apiClient<CharacterData[]>("/v2/characters", "ids=all")) || [];
    return resp.map((x) => ({ ...x, crafting_discipline: (x.crafting || []).map((c) => c?.discipline).flat().join(', ') }));
};

const guilds = async (): Promise<ApiGuildDto[]> => {
    return _getGuilds(true) as Promise<ApiGuildDto[]>;
};

const items = (x: string) => {
    return apiClient("/v2/items", `ids=${x}`);
};

const legendaries = async (): Promise<LegendariesData> => {
    const [available, unlocked]: [ApiLegendaryArmoryDto[], ApiAccountLegendaryArmoryDto[]] = await Promise.all([
        apiClient<ApiLegendaryArmoryDto[]>("/v2/legendaryarmory", `ids=all`),
        apiClient<ApiAccountLegendaryArmoryDto[]>("/v2/account/legendaryarmory", ``)
    ]);
    const ids: number[] = available.map((x) => x.id);
    const expanded = await expandItems(ids, available);
    const data = mergeById(expanded, unlocked);
    const armor = groupBy(data.filter((x) => x.type === "Armor"), ['details.weight_class', 'subtype'], ['id', 'name', 'icon', 'max_count', 'count', 'rarity']) as unknown as LegendariesData['armor'];
    const trinkets = groupBy(data.filter((x) => x.type === "Trinket" && x.id !== 95093), ['subtype'], ['id', 'name', 'description', 'icon', 'max_count', 'count', 'rarity']) as unknown as LegendariesData['trinkets'];
    const back = data.filter((x) => x.type === "Back").map((x) => mapFields(x, ['id', 'name', 'description', 'icon', 'max_count', 'count', 'rarity']) as unknown as LegendaryItemSummary);
    const upgrades = data.filter((x) => ['Rune', 'Sigil'].includes(String(x.subtype)) || x.type == 'Relic').map((x) => mapFields(x, ['id', 'name', 'description', 'icon', 'max_count', 'count', 'rarity', { equipped: true }]) as unknown as LegendaryItemSummary);
    const _weapons = data.filter((x) => x.type === "Weapon");
    _weapons.forEach((x) => {
        // change subtype naming to match current one in game & Wiki
        if (x.subtype == 'Harpoon') x.subtype = 'Spear';
        else if (x.subtype == 'Speargun') x.subtype = 'Harpoon gun';
        else if (x.subtype == 'LongBow') x.subtype = 'Long bow';
        else if (x.subtype == 'ShortBow') x.subtype = 'Short bow';
    })
    const weapons = groupBy(_weapons, ['subtype'], ['id', 'name', 'description', 'icon', 'max_count', 'count', 'rarity']) as unknown as LegendariesData['weapons'];
    return { armor, trinkets, back, upgrades, weapons };
};

const prices = (x: string) => {
    return apiClient("/v2/commerce/prices", `ids=${x}`);
};

const account = async (): Promise<AccountWithLocalDates> => {
    const _acc = await apiClient<AccountData>("/v2/account", `v=${SCHEMA_VERSION}`);
    _acc.created_local = _acc.created ? new Date(_acc.created).toLocaleString() : '';
    _acc.last_modified_local = _acc.last_modified ? new Date(_acc.last_modified).toLocaleString() : '';
    return _acc as AccountWithLocalDates;
};

const sharedInventory = async (): Promise<ExpandedItem[]> => {
    const resp: Array<ItemLike | null> = (await apiClient<Array<ItemLike | null>>("/v2/account/inventory", "")) || [];
    // this endpoint returns null in "empty" slots and we don't want that
    const rawData = resp.filter((x): x is ItemLike => x != null);
    const ids: number[] = rawData.map((x) => x.id);
    return (await expandItems(ids, rawData)) as ExpandedItem[];
};

const bank = async (): Promise<ExpandedItem[]> => {
    const resp: Array<ItemLike | null> = (await apiClient<Array<ItemLike | null>>("/v2/account/bank", "")) || [];
    // this endpoint returns null in "empty" slots and we don't want that
    const rawData = resp.filter((x): x is ItemLike => x != null);
    const ids: number[] = rawData.map((x) => x.id);
    return (await expandItems(ids, rawData)) as ExpandedItem[];
};

const tokenInfo = async (): Promise<TokenInfo> => {
    return apiClient("/v2/tokeninfo", "");
};

const achievements = async (all: boolean = false): Promise<AchievementsData & { rewards_to_get: Map<string, number> }> => {
    const [categories, account, account_achievements, allIds] = await Promise.all([
        apiClient<ApiAchievementCategoryDto[]>("/v2/achievements/categories", `ids=all&v=2022-03-23T19:00:00.000Z`),
        apiClient<AccountData>("/v2/account", ""),
        apiClient<AccountAchievementData[]>("/v2/account/achievements", ""),
        apiClient<number[]>("/v2/achievements", "")
    ]);

    const normalizedAccountAchievements = (account_achievements || []).map((x) => ({
        ...x,
        bits_done: Array.isArray(x.bits_done) ? [...x.bits_done] : [...(x.bits || [])],
    }));

    const normalizedCategories: AchievementCategoryData[] = categories.map((cat) => ({
        ...cat,
        name: cat.name || '',
        description: cat.description || '',
        rewards_to_get: new Map<string, number>(),
        points_to_get: 0,
        achievements: cat.achievements.map((entry) => ({ id: typeof entry === 'number' ? entry : entry.id, name: '' })),
    }));

    return (await expandAchievements(account, normalizedCategories, normalizedAccountAchievements, allIds)) as AchievementsData & { rewards_to_get: Map<string, number> };
};

const hydrateAchievementBits = async (bits: AchievementBit[] = []) => {
    if (!Array.isArray(bits) || !bits.length) return;

    const skinIds = [...new Set(
        bits
            .filter((bit) => bit?.type === 'Skin' && bit?.id != null)
            .map((bit) => Number(bit.id))
            .filter((id: number) => Number.isFinite(id))
    )];

    const miniIds = [...new Set(
        bits
            .filter((bit) => bit?.type === 'Minipet' && bit?.id != null)
            .map((bit) => Number(bit.id))
            .filter((id: number) => Number.isFinite(id))
    )];

    await Promise.all([
        skinIds.length ? skins(skinIds) : Promise.resolve([]),
        miniIds.length ? minis(miniIds) : Promise.resolve([]),
    ]);
};

const achievementsInfo = async (ids: string): Promise<AchievementData[]> => {
    return apiClient<AchievementData[]>("/v2/achievements", "ids=" + ids);
};

const minis = async (ids: number[]): Promise<void> => {
    ids = ids.filter((x: number) => !minisCache.has(x));
    const batches = [];
    do {
        let batch = ids.splice(0, 200);
        if (batch.length > 0) {
            batches.push(batch.join(","));
        }
    } while (ids.length > 0);
    if (batches.length) {
        const tasks = batches.map((ids) => apiClient<ApiMiniDto[]>("/v2/minis", "ids=" + ids));
        const resp: ApiMiniDto[] = (await Promise.all(tasks)).flat();
        resp.forEach((x) => {
            if (x) {
                minisCache.set(x.id, x);
            }
        });
        await ls.set(MINIS_CACHE, [...minisCache.entries()]);
    }

}

const skins = async (ids: number[]): Promise<void> => {
    ids = ids.filter((x: number) => !skinsCache.has(x));
    const batches = [];
    do {
        let batch = ids.splice(0, 200);
        if (batch.length > 0) {
            batches.push(batch.join(","));
        }
    } while (ids.length > 0);
    if (batches.length) {
        const tasks = batches.map((ids) => apiClient<ApiSkinDto[]>("/v2/skins", "ids=" + ids));
        const resp: ApiSkinDto[] = (await Promise.all(tasks)).flat();
        resp.forEach((x) => {
            if (x) {
                skinsCache.set(x.id, x);
            }
        });
        await ls.set(SKINS_CACHE, [...skinsCache.entries()]);
    }

}

const currencies = async (order: number[] = []): Promise<WalletCurrency[]> => {
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
    type CurrencyEntry = ApiCurrencyDto & { depreciated?: boolean; active?: number; [key: string]: unknown };
    const resp = await apiClient<CurrencyEntry[]>("/v2/currencies", `ids=all`);
    const _rawData = resp.filter((x) => !ignored.includes(x.id)).map((x) => ({ ...x, active: 1, value: 0 }));
    const _data = mergeById(_rawData, _dep);
    _data.forEach(x => {
        const idx = order.findIndex(y => y == x.id)
        x.order = (idx >= 0) ? idx : x.depreciated ? x.order + 20000 : x.order + 10000;
    });
    return _data.sort((a, b) => a.order - b.order) as unknown as WalletCurrency[];
}

const wallet = async (order: number[] = []): Promise<WalletCurrency[]> => {
    const [_curr, _wallet] = await Promise.all([
        currencies(order),
        apiClient<ApiWalletDto[]>("/v2/account/wallet", "")
    ]);
    return (mergeById(_curr, _wallet) as Array<WalletCurrency & { value?: number }>).map((x) => ({ ...x, value: x.value ?? 0 }));
}



const delivery = async (): Promise<DeliveryData> => {
    const resp = await apiClient<ApiCommerceDeliveryDto>("/v2/commerce/delivery", "");
    const ids = resp.items.map((x) => x.id);
    const expanded = await expandItems(ids, resp.items as ItemLike[]);
    return {
        ...resp,
        items: expanded as ExpandedItem[],
    };
};

const wizardVaultSorted = async (promise: Promise<WizardsVaultCategoryData>): Promise<WizardsVaultCategoryData> => {
    const resp = await promise;
    const byClaimed = Object.groupBy((resp.objectives || []), (x) => String(Boolean(x.claimed))) as Record<string, NonNullable<WizardsVaultCategoryData['objectives']>>;
    byClaimed.false ??= [];
    byClaimed.true ??= [];
    resp.objectives = byClaimed.false.sort((a, b) => a.track.localeCompare(b.track) || a.title.localeCompare(b.title));
    resp.objectives.push(...byClaimed.true.sort((a, b) => a.track.localeCompare(b.track) || a.title.localeCompare(b.title)));
    return resp;
}

const wizardsVaultDaily = async (): Promise<WizardsVaultCategoryData> => {
    return wizardVaultSorted(apiClient("/v2/account/wizardsvault/daily", ""));
}

const wizardsVaultWeekly = async (): Promise<WizardsVaultCategoryData> => {
    return wizardVaultSorted(apiClient("/v2/account/wizardsvault/weekly", ""));
}

const wizardsVaultSpecial = async (): Promise<WizardsVaultCategoryData> => {
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

const mergeById = <TBase extends { id: number }, TDetails extends { id: number }>(a1: TBase[], a2: TDetails[]) => {
    return a1.filter((x): x is TBase => x != undefined).map((t1) => ({ ...t1, ...a2.find((t2) => t2.id === t1.id) }));
};

const addPropertiesById = <TBase extends Dictionary & { id?: number }, TDetails extends { id: number } & Dictionary>(base: TBase, details: TDetails[]) => {
    const clone = JSON.parse(JSON.stringify(base));
    const match = details.find(x => x.id == base.id);
    if (!match) return;
    // console.log('addPropertiesById', {clone, details})
    for (const key of Object.keys(match)) {
        if (key != 'id') {
            (base as Dictionary)[key] = match[key as keyof TDetails];
        }
    }
}

const expandItems = async <T extends { id: number }>(ids: Array<number>, collection: T[]): Promise<Array<T & ItemLike>> => {
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

        const fetchPromise = Promise.all(batches.map((ids) => items(ids) as Promise<ItemLike[]>)).then(results => results.flat());

        // Register each id as inflight
        for (const id of allToFetch) {
            inflightItems.set(id, fetchPromise);
        }

        try {
            const resp: ItemLike[] = await fetchPromise;
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
    const data = mergeById(collection, knownItems) as Array<T & ItemLike>;
    const missingAfterMerge = data.filter(x => x.id && !(x as { name?: string }).name && !INVALID_ITEM_IDS.includes(x.id));
    if (missingAfterMerge.length) {
        console.warn('expandItems: items without name after merge:', missingAfterMerge.map(x => x.id), { collectionSize: collection.length, knownItemsSize: knownItems.length, idsSize: ids.length });
    }
    additionalMapping(data);

    return data;
};

const expandPrices = async <T extends { id: number }>(ids: Array<number>, collection: T[]): Promise<Array<T & ApiCommercePriceDto>> => {
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
        const resp: ApiCommercePriceDto[] = (await Promise.all(tasks as Array<Promise<ApiCommercePriceDto[]>>)).flat();
        data.push(...mergeById(collection, resp)); // have to merge based on collection, not list of prices because it otherwise ommits transactions with other asking price
    }
    return data as Array<T & ApiCommercePriceDto>;
};

const expandAchievements = async (account: AccountData, categories: AchievementCategoryData[], accountAchievements: AccountAchievementData[], allIds: number[]) => {
    Object.keys(ACHIEVEMENTS_NOT_IN_API).forEach((x: string) => {
        allIds.push(...(ACHIEVEMENTS_NOT_IN_API[x] || []));
    })

    const knownIds = [...achievementsCache.keys()];
    const _doneIds = accountAchievements.filter((x) => x.done === true).map((x) => x.id);
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
        const resp: AchievementData[] = (await Promise.all(tasks)).filter(x => wxjs_types.isArray(x)).flat();
        const itemIds: number[] = [];
        const skinIds: number[] = [];
        const miniIds: number[] = [];
        resp.forEach((x: AchievementData) => {
            if (x) {
                x.description = toHtml(x.description ?? null)
                if (x.type == 'ItemSet' && x.bits) {

                    itemIds.push(...(x.bits.filter((xx) => xx.type == "Item" && xx.id != null).map((xxx) => Number(xxx.id))));
                    skinIds.push(...(x.bits.filter((xx) => xx.type == "Skin" && xx.id != null).map((xxx) => Number(xxx.id))));
                    miniIds.push(...(x.bits.filter((xx) => xx.type == "Minipet" && xx.id != null).map((xxx) => Number(xxx.id))));
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
    categories.forEach((cat) => {
        achievsInCategories.push(...cat.achievements.map((x) => Number((x as { id?: number }).id || 0)).filter((x) => x > 0));
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
        achievements: noCategory.map((x: number) => ({ id: x, name: '' }))
    });

    categories.forEach((cat) => {
        // if (ACHIEVEMENTS_NOT_IN_API[cat.id]) {
        //     const tmp = cat.achievements;
        //     tmp.push(...(ACHIEVEMENTS_NOT_IN_API[cat.id].map(x => ({ id: x }))));
        //     cat.achievements = unique(tmp);
        // }
        _log += `${cat.id}, // ${cat.name}\n`;
        cat.ignore = (ignored_achievements.includes(cat.id)) ? true : false;
        const categoryAchievements = cat.achievements
            .map((entry) => ({ id: Number((entry as { id?: number }).id || 0) }))
            .filter((entry): entry is { id: number } => entry.id > 0);
        cat.achievements = categoryAchievements.map((x) => {
            let achiev = achievementsCache.get(x.id);
            if (!achiev) {
                console.warn('achiev Id not found', x.id);
                achiev = x;
            }
            const mine = accountAchievements.find((acv) => acv.id == x.id) || {
                id: x.id,
                current: 0,
                repeated: 0,
                bits_done: [],
                done: false,
                max: achiev.bits != undefined ? achiev.bits.length : 0,
            };
            mine.repeated ??= 0;
            const { bits: _mineBits, ...mineRest } = mine;
            let points_per_tier = 0;
            let points_done = 0;
            let points_to_get = 0;

            if (achiev.tiers) {
                const tiers_done = achiev.tiers.filter((t) => t.count <= Number(mine.current || 0));
                const tiers_todo = achiev.tiers.filter((t) => t.count > Number(mine.current || 0));
                points_per_tier = sum(achiev.tiers as unknown as Array<Record<string, unknown>>, 'points' as never);
                points_done = points_per_tier * mine.repeated + sum(tiers_done as unknown as Array<Record<string, unknown>>, 'points' as never);
                if (achiev.point_cap && (achiev.point_cap < points_done)) {
                    points_done = achiev.point_cap;
                }
                points_to_get = (achiev.point_cap && (points_done >= achiev.point_cap)) ? 0 : sum(tiers_todo as unknown as Array<Record<string, unknown>>, 'points' as never);
            }
            achiev.rewardsObj = achiev.rewards ? Object.groupBy(achiev.rewards, (x) => x.type.toLowerCase()) : {};
            achiev.icon ??= cat.icon;

            return {
                ...achiev,
                ...mineRest,
                points_per_tier,
                points_done,
                points_to_get,
            }
        });
        // missing 
        if (cat.id == 0) {
            // console.log('missing...')
            // remove daily and weekly from missing achievements
            cat.achievements = cat.achievements.filter((x) => !((x.flags || []).includes('Daily') || (x.flags || []).includes('Weekly')));
            // console.log('missing', cat.achievements)
        }
        cat.points_to_get = sum(cat.achievements as Array<Record<string, unknown>>, 'points_to_get' as never);
        cat.points_done = sum(cat.achievements as Array<Record<string, unknown>>, 'points_done' as never);
        cat._rewards_to_get = cat.achievements.filter((x) => !x.done && x.rewards).flatMap((x) => x.rewards || [])
        // aggregating and mapping from array of objects to object with nested arrays of objects, group by 'type' field
        // cat.rewards = Object.groupBy(cat_rewards, x => x.type.toLowerCase())
        // cat.titles_to_get = cat.achievements.filter(x => !x.done && x.rewardsObj.title).length;
        // cat.items_to_get = cat.achievements.filter(x => !x.done && x.rewardsObj.item).length;

        cat.rewards_to_get = new Map();
        sumRewards(cat.rewards_to_get as Map<string, number>, cat._rewards_to_get as AchievementReward[]);
        // cat.mastery_to_get.Tyria = cat.achievements.filter(x => !x.done && x.rewardsObj.item && x.rewardsObj.item.find(y => y.region == 'Tyria')).length;
    })

    // console.log('achiev ids:', _log);

    // get all masteries for dev purposes
    // const tmp = categories.map(c => c.rewards.mastery).filter(x => x != undefined).flat(true).map((x => x.region))
    // console.log('masteries', [... new Set(tmp)])

    const rewards_to_get = new Map();

    categories.forEach((x) => {
        sumRewards(rewards_to_get, x._rewards_to_get as AchievementReward[])
    });

    return {
        completed: _doneIds.length,
        todo: _notDone.length,
        daily_ap: account.daily_ap ?? 0,
        monthly_ap: account.monthly_ap ?? 0,
        categories,
        rewards_to_get,
    } as unknown;
};

const sanitizeApiHtml = (html: string): string => {
    const stripDangerous = (input: string) => input
        .replace(/<\/?(script|style|iframe|object|embed|meta|link)\b[^>]*>/gi, '')
        .replace(/\son\w+\s*=\s*(["']).*?\1/gi, '')
        .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
        .replace(/\s(?:href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\1/gi, '');

    if (typeof DOMParser === 'undefined') {
        return stripDangerous(html);
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
    const container = doc.body.firstElementChild as HTMLElement | null;
    if (!container) return '';

    const allowedTags = new Set(['a', 'b', 'br', 'div', 'em', 'i', 'li', 'ol', 'p', 'span', 'strong', 'u', 'ul']);
    const allowedAttrs = new Set(['class', 'href', 'rel', 'target']);

    const all = Array.from(container.querySelectorAll('*'));
    for (const element of all) {
        const tag = element.tagName.toLowerCase();
        if (!allowedTags.has(tag)) {
            const parent = element.parentNode;
            if (!parent) continue;
            while (element.firstChild) {
                parent.insertBefore(element.firstChild, element);
            }
            parent.removeChild(element);
            continue;
        }

        for (const attr of Array.from(element.attributes)) {
            const name = attr.name.toLowerCase();
            const value = attr.value;
            if (name.startsWith('on') || !allowedAttrs.has(name)) {
                element.removeAttribute(attr.name);
                continue;
            }
            if ((name === 'href') && /^\s*javascript:/i.test(value)) {
                element.removeAttribute(attr.name);
            }
        }

        if (tag === 'a') {
            element.setAttribute('rel', 'noreferrer noopener');
            if (element.getAttribute('target') !== '_blank') {
                element.removeAttribute('target');
            }
        }
    }

    return stripDangerous(container.innerHTML);
}

const toHtml = (text: string | null): string => {
    let descr = text || '';
    descr = descr.replace(/<c=@flavor>/gi, '<span class="flavor">');
    descr = descr.replace(/<c=@warning>/gi, '<span class="warning">');
    descr = descr.replace(/<\/c>/gi, '</span>');
    return sanitizeApiHtml(descr);
}

const additionalMapping = <T extends { description?: string; details?: { type?: string; description?: string }; subtype?: string; subdescr?: string; charges?: number; count?: number }>(data: T[]) => {
    data.forEach((element) => {
        if (element.charges) {
            element.count = element.charges;
        }
        element.description = toHtml(element.description ?? null);
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
    hydrateAchievementBits,
    currentSeason: () => _settings.currentSeason,
    wizardsVault: () => _settings.wizardsVault,
};
