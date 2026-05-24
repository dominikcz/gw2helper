import Logger from "./logger";
import ls from "./wxjs_idb";
import wx from "./wxjs_types";
import { ACHIEVEMENTS_CACHE, ITEMS_CACHE, KEY_HIST, MINIS_CACHE, REQUESTS_CACHE, SKINS_CACHE } from "$lib/consts";
import { sum, getQueryStringFlag } from "./utils";
import wxjs_types from "./wxjs_types";
import { INACTIVE_ACHIEVEMENTS_CATEGORIES, SEASONAL_ACHIEVEMENTS_CATEGORIES, sumRewards } from "./components/achievements/achievements";
import { getScopes, createScopeError } from "$lib/services/api/layers/authorization";
import { additionalMapping, toHtml } from "$lib/services/api/layers/mapping";
import { buildEntityCacheName, buildRequestCacheName } from "$lib/services/api/layers/cache-keys";
import { getValidCacheEntry, persistCacheEntry, type CacheEntry } from "$lib/services/api/layers/cache";
import { clearCacheStorage, loadEntityCaches, loadRequestCache } from "$lib/services/api/layers/bootstrap";
import { readAndNormalizeSettings, type GW2HelperSettings } from "$lib/services/api/layers/settings";
import {
    createApiRuntimeState,
    createDefaultApiClientOptions,
    hasLanguageChanged,
    mergeApiClientOptions,
    shouldSkipInit,
    type ApiClientOptions,
    type TokenInfo,
} from "$lib/services/api/layers/runtime";
import {
    decodeApiResponseData,
    throwApiResponseError,
    toAbsoluteRequest,
    toAuthorizedUrl,
    toRequestKey,
    toScopeRequest,
    withLanguageQuery,
} from "$lib/services/api/layers/transport";
import { mapTransactionsForCurrent, sumQuantitiesByItemAndPrice } from "$lib/services/api/domains/transactions";
import { sortWizardsVaultObjectives } from "$lib/services/api/domains/wizards-vault";
import { buildLegendariesData } from "$lib/services/api/domains/legendaries";
import { buildCharacterItemCollection, collectItemIds, normalizeNonNullItems } from "$lib/services/api/domains/items-materials";
import { collectUniqueGuildIds, mapCharactersWithCrafting, withLocalAccountDates } from "$lib/services/api/domains/account-characters-guilds";
import { applyCurrencyOrder, buildDeprecatedCurrencyOverlay } from "$lib/services/api/domains/wallet";
import {
    buildIgnoredAchievementIds,
    collectUncategorizedAchievementIds,
    normalizeAccountAchievements,
    normalizeAchievementCategories,
} from "$lib/services/api/domains/achievements";
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
    ApiCommerceListingsDto,
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

const SCHEMA_VERSION = '2019-12-19T00:00:00.000Z'; // or 'latest'?

const ignoreCache = getQueryStringFlag('ignore-cache');
const devMode = getQueryStringFlag('dev-mode');
const realApi = getQueryStringFlag('real-api');


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

let itemsCache: Map<number, ItemLike>;
let minisCache: Map<number, ApiMiniDto>;
let skinsCache: Map<number, ApiSkinDto>;
let achievementsCache: Map<number, AchievementData>;
let requestCache: Map<string, CacheEntry>;
let inflightItems: Map<number, Promise<ItemLike[]>> = new Map();
const runtime = createApiRuntimeState(createDefaultApiClientOptions({
    devMode,
    realApi,
    defaultApiUrl,
    mockApiUrl,
}));

const requestCacheName = (): string => buildRequestCacheName(REQUESTS_CACHE, runtime.apiKey);

const entityCacheName = (base: string): string => buildEntityCacheName(base, runtime.fetchOptions.apiLang);

// const notifyOnError = (req, error, options) => {
//     if (runtime.fetchOptions.onError) {
//         runtime.fetchOptions.onError(req, error, options);
//     }
// };

const getFromAchievementsCache = (key: string): AchievementData | undefined => {
    return achievementsCache.get(Number(key));
}

const apiClient = async <T = unknown>(req: string | RequestInfo, query: string, options?: Partial<ApiClientOptions>): Promise<T> => {
    if (!runtime.apiKey) {
        Logger.error('not initialized, please provide api key from https://account.arena.net');
        return null as unknown as T;
    }
    const scopeReq = toScopeRequest(req);
    let missingScopes = getScopes(scopeReq).filter(x => !runtime.tokenInfo.permissions.includes(x));
    if (missingScopes.length) {
        runtime.tokenInfo.missingScopes.push(...missingScopes);
        throw createScopeError(missingScopes)
    }
    const queryWithLang = withLanguageQuery(query, runtime.fetchOptions.apiLang);
    const requestKey = toRequestKey(req, queryWithLang);
    const _options: ApiClientOptions = mergeApiClientOptions(runtime.fetchOptions, options);
    const cacheResult = !ignoreCache ? getValidCacheEntry({
        apiKey: runtime.apiKey,
        requestKey,
        requestCache,
        timeoutSeconds: CACHE_TIMEOUT,
    }) : {};
    if (cacheResult.entry !== undefined) {
        Logger.always('tryCache hit, reusing cache', { req: requestKey, ageSeconds: cacheResult.ageSeconds });
        Logger.log("requestCache is valid, returning cached response");
        return cacheResult.entry.data as T;
    }

    Logger.log("requestCache is INVALID, refreshing...");

    const absoluteReq = toAbsoluteRequest(req, _options.baseURL);

    if (_options.debug) {
        Logger.log(`req: ${absoluteReq}, options: `, _options);
    }
    const requestUrl = toAuthorizedUrl(absoluteReq, runtime.apiKey, queryWithLang);
    const response = await _options.fetchFunction(requestUrl, _options as RequestInit).catch(error => {
        Logger.error('error', error);
    });
    if (response && response.status >= 400) {
        await throwApiResponseError(response);
    } else if (response?.ok) {
        const data = await decodeApiResponseData<T>(response, _options.expectJson, _options.transform);
        await persistCacheEntry({
            requestKey,
            value: data,
            timeoutSeconds: CACHE_TIMEOUT,
            requestCache,
            persist: async (entries) => ls.set(requestCacheName(), entries),
        });
        Logger.log(`requestCache for ${requestKey} updated`, data);
        return data as T;
    }

    Logger.warn(`got response.status = ${response?.status} for ${requestKey}... returning empty`);
    return (queryWithLang ? [] : {}) as T;
};

const charactersItems = async (): Promise<CharacterWithItems[]> => {
    const rawData: CharacterData[] = (await apiClient<CharacterData[]>("/v2/characters", "ids=all")) || [];
    for (const char of rawData) {
        const charItems = buildCharacterItemCollection(char) as ItemLike[];
        const ids = collectItemIds(charItems);
        char._items = (await expandItems(ids, charItems)) as ExpandedItem[];
    }
    return rawData as CharacterWithItems[];
};

const materials = async (): Promise<ExpandedItem[]> => {
    const rawData: ItemLike[] = (await apiClient<ItemLike[]>("/v2/account/materials", "")) || [];
    const ids = collectItemIds(rawData);
    return (await expandItems(ids, rawData)) as ExpandedItem[];
};


const _getTransactions = async (_transactions: TransactionData[], offerType: 'buys' | 'sells'): Promise<TransactionCurrentItem[]> => {
    const transactions: TransactionExpanded[] = mapTransactionsForCurrent(_transactions) as TransactionExpanded[];


    const ids: number[] = transactions.map((x) => x.id);

    // let sum = sumGroupBy(exp, ['item_id', 'price'], 'count')
    let sum = sumQuantitiesByItemAndPrice(transactions);
    sum = await expandItems(ids, sum);
    sum = await expandPrices(ids, sum);
    return expandOutbidQuantities(sum as TransactionCurrentItem[], offerType);
}

const transactionsCurrent = async (): Promise<{ buys: TransactionCurrentItem[]; sells: TransactionCurrentItem[] }> => {
    const [_buys, _sells] = await Promise.all([
        apiClient<TransactionData[]>("/v2/commerce/transactions/current/buys", ""),
        apiClient<TransactionData[]>("/v2/commerce/transactions/current/sells", "")
    ]);
    const [buys, sells] = await Promise.all([
        _getTransactions(_buys, 'buys'),
        _getTransactions(_sells, 'sells')
    ]);
    return { buys, sells };
}

const _getGuilds = async (full: boolean = false): Promise<ApiGuildDto[]> => {
    const account = await apiClient<AccountData>("/v2/account", "");
    // concat and remove duplicates
    const _guilds = collectUniqueGuildIds(account);

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
            const ids = collectItemIds(normalizedStashRaw);
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
    return mapCharactersWithCrafting(resp);
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
    return buildLegendariesData(data);
};

const prices = (x: string) => {
    return apiClient("/v2/commerce/prices", `ids=${x}`);
};

const listings = (x: string) => {
    return apiClient<ApiCommerceListingsDto[]>("/v2/commerce/listings", `ids=${x}`);
};

const expandOutbidQuantities = async (
    collection: TransactionCurrentItem[],
    offerType: 'buys' | 'sells'
): Promise<TransactionCurrentItem[]> => {
    const outbidItems = collection.filter((item) => {
        const offer = item[offerType];
        if (!offer?.unit_price) return false;
        return offerType === 'sells' ? item.price > offer.unit_price : item.price < offer.unit_price;
    });

    if (!outbidItems.length) return collection;

    const ids = outbidItems.map((x) => x.id).filter((id) => !INVALID_ITEM_IDS.includes(id));

    const batches: string[] = [];
    const idsCopy = [...ids];
    do {
        const batch = idsCopy.splice(0, 200);
        if (batch.length > 0) batches.push(batch.join(','));
    } while (idsCopy.length > 0);

    const listingsData: ApiCommerceListingsDto[] = (
        await Promise.all(batches.map((b) => listings(b)))
    ).flat() as ApiCommerceListingsDto[];

    const listingsById = new Map<number, ApiCommerceListingsDto>();
    for (const l of listingsData) {
        listingsById.set(l.id, l);
    }

    return collection.map((item) => {
        const listing = listingsById.get(item.id);
        if (!listing) return item;

        const outbid_quantity =
            offerType === 'sells'
                ? listing.sells.filter((t) => t.unit_price < item.price).reduce((acc, t) => acc + t.quantity, 0)
                : listing.buys.filter((t) => t.unit_price > item.price).reduce((acc, t) => acc + t.quantity, 0);

        return { ...item, outbid_quantity };
    });
};

const account = async (): Promise<AccountWithLocalDates> => {
    const _acc = await apiClient<AccountData>("/v2/account", `v=${SCHEMA_VERSION}`);
    return withLocalAccountDates(_acc) as AccountWithLocalDates;
};

const sharedInventory = async (): Promise<ExpandedItem[]> => {
    const resp: Array<ItemLike | null> = (await apiClient<Array<ItemLike | null>>("/v2/account/inventory", "")) || [];
    // this endpoint returns null in "empty" slots and we don't want that
    const rawData = normalizeNonNullItems(resp);
    const ids = collectItemIds(rawData);
    return (await expandItems(ids, rawData)) as ExpandedItem[];
};

const bank = async (): Promise<ExpandedItem[]> => {
    const resp: Array<ItemLike | null> = (await apiClient<Array<ItemLike | null>>("/v2/account/bank", "")) || [];
    // this endpoint returns null in "empty" slots and we don't want that
    const rawData = normalizeNonNullItems(resp);
    const ids = collectItemIds(rawData);
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

    const normalizedAccountAchievements = normalizeAccountAchievements(account_achievements || []);

    const normalizedCategories: AchievementCategoryData[] = normalizeAchievementCategories(categories);

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
        await ls.set(entityCacheName(MINIS_CACHE), [...minisCache.entries()]);
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
        await ls.set(entityCacheName(SKINS_CACHE), [...skinsCache.entries()]);
    }

}

const currencies = async (order: number[] = []): Promise<WalletCurrency[]> => {
    const _dep = buildDeprecatedCurrencyOverlay();
    const ignored = [74];
    type CurrencyEntry = ApiCurrencyDto & { depreciated?: boolean; active?: number; [key: string]: unknown };
    const resp = await apiClient<CurrencyEntry[]>("/v2/currencies", `ids=all`);
    const _rawData = resp.filter((x) => !ignored.includes(x.id)).map((x) => ({ ...x, active: 1, value: 0 }));
    const _data = mergeById(_rawData, _dep);
    return applyCurrencyOrder(_data, order) as unknown as WalletCurrency[];
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
    return sortWizardsVaultObjectives(resp);
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
    const nextFetchOptions = mergeApiClientOptions(runtime.fetchOptions, options);
    const languageChanged = hasLanguageChanged(runtime.fetchOptions, nextFetchOptions);
    if (shouldSkipInit(newApiKey, runtime.apiKey, languageChanged)) return;

    runtime.apiKey = newApiKey;
    runtime.fetchOptions = nextFetchOptions;

    const entityCaches = await loadEntityCaches<ItemLike, ApiMiniDto, ApiSkinDto, AchievementData>({
        storage: ls,
        entityCacheName,
        keys: {
            items: ITEMS_CACHE,
            minis: MINIS_CACHE,
            skins: SKINS_CACHE,
            achievements: ACHIEVEMENTS_CACHE,
        },
    });
    itemsCache = entityCaches.itemsCache;
    minisCache = entityCaches.minisCache;
    skinsCache = entityCaches.skinsCache;
    achievementsCache = entityCaches.achievementsCache;

    Logger.log("apiService.init", newApiKey);
    requestCache = await loadRequestCache({
        storage: ls,
        requestCacheName,
    });
    _settings = await readAndNormalizeSettings({
        fetchFunction: runtime.fetchOptions.fetchFunction,
        currentSettings: _settings,
        isObject: wxjs_types.isObject,
        addMonths: (value: Date, unit: string, amount: number) => {
            const next = new Date(value);
            if (unit === 'month') {
                next.setMonth(next.getMonth() + amount);
            }
            return next;
        },
        onWarn: (message, details) => Logger.warn(message, details),
        onError: (message, details) => Logger.error(message, details),
    });
    try {
        runtime.tokenInfo = await tokenInfo();
    } catch (error) {
        runtime.tokenInfo.error = error instanceof Error ? error.message : String(error);
    }
    // Logger.log('tokenInfo', { tokenInfo: runtime.tokenInfo });
};

const mergeById = <TBase extends { id: number }, TDetails extends { id: number }>(a1: TBase[], a2: TDetails[]) => {
    const byId = new Map<number, TDetails>();
    for (const detail of a2) {
        if (detail && !byId.has(detail.id)) {
            byId.set(detail.id, detail);
        }
    }

    return a1
        .filter((x): x is TBase => x != undefined)
        .map((t1) => {
            const match = byId.get(t1.id);
            return match ? { ...t1, ...match } : t1;
        });
};

const addPropertiesById = <TBase extends Dictionary & { id?: number }, TDetails extends { id: number } & Dictionary>(base: TBase, details: TDetails[]) => {
    const match = details.find(x => x.id == base.id);
    if (!match) return;
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
            await ls.set(entityCacheName(ITEMS_CACHE), [...itemsCache.entries()]);
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
        Logger.warn('expandItems: items NOT in cache after fetch:', { missingFromCache });
    }
    const knownItems = ids.map((x) => itemsCache.get(x)).filter(x => x != null);
    const data = mergeById(collection, knownItems) as Array<T & ItemLike>;
    const missingAfterMerge = data.filter(x => x.id && !(x as { name?: string }).name && !INVALID_ITEM_IDS.includes(x.id));
    if (missingAfterMerge.length) {
        Logger.warn('expandItems: items without name after merge:', { missingAfterMerge: missingAfterMerge.map(x => x.id), collectionSize: collection.length, knownItemsSize: knownItems.length, idsSize: ids.length });
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
    const knownIdsSet = new Set(knownIds);
    const invalidAchievementIdsSet = new Set(INVALID_ACHIEVEMENTS_IDS);
    const _doneIds = accountAchievements.filter((x) => x.done === true).map((x) => x.id);
    const doneIdsSet = new Set(_doneIds);
    const _notDone = allIds.filter((x: number) => !doneIdsSet.has(x));
    const missingIds = allIds.filter((x: number) => !invalidAchievementIdsSet.has(x) && !knownIdsSet.has(x));
    const accountAchievementsById = new Map(accountAchievements.map((achiev) => [achiev.id, achiev]));

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
        await ls.set(entityCacheName(ACHIEVEMENTS_CACHE), [...achievementsCache.entries()]);
        mergeById(resp, accountAchievements);

        // Do not block initial achievements page render on reward entity hydration.
        // Tooltip renderer can lazy-load these on demand.
        const uniqueItemIds = [...new Set(itemIds)];
        const uniqueMiniIds = [...new Set(miniIds)];
        const uniqueSkinIds = [...new Set(skinIds)];

        void Promise.all([
            uniqueItemIds.length ? expandItems(uniqueItemIds, uniqueItemIds.map((x: number) => ({ id: x }))) : Promise.resolve([]),
            uniqueMiniIds.length ? minis(uniqueMiniIds) : Promise.resolve(),
            uniqueSkinIds.length ? skins(uniqueSkinIds) : Promise.resolve(),
        ]).catch((error) => {
            Logger.warn('background reward hydration failed', {
                error: error instanceof Error ? error.message : String(error),
            });
        });
    }

    let _log = '';

    // we don't want categories of achievements that are not obtainable anymore
    Logger.log('current season:', { season: _settings.currentSeason });
    const ignoredAchievementIds = buildIgnoredAchievementIds(_settings.currentSeason, INACTIVE_ACHIEVEMENTS_CATEGORIES, SEASONAL_ACHIEVEMENTS_CATEGORIES);
    const noCategory = collectUncategorizedAchievementIds(categories, allIds, ignoredAchievementIds);

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
        cat.ignore = ignoredAchievementIds.has(cat.id);
        const categoryAchievements = cat.achievements
            .map((entry) => ({ id: Number((entry as { id?: number }).id || 0) }))
            .filter((entry): entry is { id: number } => entry.id > 0);
        cat.achievements = categoryAchievements.map((x) => {
            let achiev = achievementsCache.get(x.id);
            if (!achiev) {
                Logger.warn('achiev Id not found', x.id);
                achiev = x;
            }
            const mine = accountAchievementsById.get(x.id) || {
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
            // remove daily and weekly from missing achievements
            cat.achievements = cat.achievements.filter((x) => !((x.flags || []).includes('Daily') || (x.flags || []).includes('Weekly')));
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


    // get all masteries for dev purposes
    // const tmp = categories.map(c => c.rewards.mastery).filter(x => x != undefined).flat(true).map((x => x.region))

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

const clearCache = async () => {
    Logger.log('clearing cache...');
    await clearCacheStorage({
        storage: ls,
        requestCacheName,
        entityCacheName,
        keys: {
            items: ITEMS_CACHE,
            minis: MINIS_CACHE,
            skins: SKINS_CACHE,
            achievements: ACHIEVEMENTS_CACHE,
            keyHistory: KEY_HIST,
        },
    });
    itemsCache.clear();
    achievementsCache.clear();
    requestCache.clear();
    minisCache.clear();
    skinsCache.clear();
    inflightItems.clear();
}

const getApiKey = () => {
    return runtime.apiKey;
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
        runtime.tokenInfo.missingScopes = [];
    },
    tokenInfo: () => runtime.tokenInfo,
    itemsCache: (id: string | number) => itemsCache.get(parseInt(String(id))),
    minisCache: (id: string | number) => minisCache.get(parseInt(String(id))),
    skinsCache: (id: string | number) => skinsCache.get(parseInt(String(id))),
    achievementsCache: (id: string | number) => achievementsCache.get(parseInt(String(id))),
    hydrateAchievementBits,
    currentSeason: () => _settings.currentSeason,
    wizardsVault: () => _settings.wizardsVault,
};
