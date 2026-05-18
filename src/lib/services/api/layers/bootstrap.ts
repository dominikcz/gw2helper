import type { CacheEntry } from '$lib/services/api/layers/cache';

interface StorageLike {
    getObject<T>(key: string, fallback: T): Promise<T>;
    delete(key: string): Promise<void>;
}

async function readNumberKeyMap<T>(storage: StorageLike, key: string): Promise<Map<number, T>> {
    const entries = await storage.getObject<Array<[number, T]>>(key, []);
    return entries?.length ? new Map<number, T>(entries) : new Map<number, T>();
}

export async function loadEntityCaches<TItem, TMini, TSkin, TAchievement>(params: {
    storage: StorageLike;
    entityCacheName: (base: string) => string;
    keys: {
        items: string;
        minis: string;
        skins: string;
        achievements: string;
    };
}): Promise<{
    itemsCache: Map<number, TItem>;
    minisCache: Map<number, TMini>;
    skinsCache: Map<number, TSkin>;
    achievementsCache: Map<number, TAchievement>;
}> {
    const { storage, entityCacheName, keys } = params;

    const [itemsCache, minisCache, skinsCache, achievementsCache] = await Promise.all([
        readNumberKeyMap<TItem>(storage, entityCacheName(keys.items)),
        readNumberKeyMap<TMini>(storage, entityCacheName(keys.minis)),
        readNumberKeyMap<TSkin>(storage, entityCacheName(keys.skins)),
        readNumberKeyMap<TAchievement>(storage, entityCacheName(keys.achievements)),
    ]);

    return { itemsCache, minisCache, skinsCache, achievementsCache };
}

export async function loadRequestCache(params: {
    storage: StorageLike;
    requestCacheName: () => string;
}): Promise<Map<string, CacheEntry>> {
    const { storage, requestCacheName } = params;
    const entries = await storage.getObject<Array<[string, CacheEntry]>>(requestCacheName(), []);
    return entries?.length ? new Map<string, CacheEntry>(entries) : new Map<string, CacheEntry>();
}

export async function clearCacheStorage(params: {
    storage: StorageLike;
    requestCacheName: () => string;
    entityCacheName: (base: string) => string;
    keys: {
        items: string;
        minis: string;
        skins: string;
        achievements: string;
        keyHistory: string;
    };
}): Promise<void> {
    const { storage, requestCacheName, entityCacheName, keys } = params;

    await storage.delete(requestCacheName());
    await storage.delete(entityCacheName(keys.items));
    await storage.delete(entityCacheName(keys.minis));
    await storage.delete(entityCacheName(keys.skins));
    await storage.delete(entityCacheName(keys.achievements));

    // Cleanup legacy non-language keys.
    await storage.delete(keys.items);
    await storage.delete(keys.minis);
    await storage.delete(keys.skins);
    await storage.delete(keys.achievements);
    await storage.delete(keys.keyHistory);
}
