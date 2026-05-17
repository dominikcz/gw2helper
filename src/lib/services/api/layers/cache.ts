export interface CacheEntry {
    time: Date | string;
    timeout: number;
    data: unknown;
}

function secondsBetween(d1: Date | string, d2: Date): number {
    const start = (typeof d1 === 'string') ? new Date(d1) : d1;
    return Math.round(Math.abs(start.getTime() - d2.getTime()) / 1000);
}

export function getValidCacheEntry(params: {
    apiKey: string;
    requestKey: string;
    requestCache: Map<string, CacheEntry>;
    timeoutSeconds: number;
}): { entry?: CacheEntry; ageSeconds?: number } {
    const { apiKey, requestKey, requestCache, timeoutSeconds } = params;
    if (!apiKey || !requestCache.has(requestKey)) {
        return {};
    }

    const entry = requestCache.get(requestKey);
    if (!entry) {
        return {};
    }

    const ageSeconds = secondsBetween(entry.time, new Date());
    if (ageSeconds < timeoutSeconds) {
        return { entry, ageSeconds };
    }

    return {};
}

export async function persistCacheEntry(params: {
    requestKey: string;
    value: unknown;
    timeoutSeconds: number;
    requestCache: Map<string, CacheEntry>;
    persist: (entries: [string, CacheEntry][]) => Promise<void>;
}): Promise<void> {
    const { requestKey, value, timeoutSeconds, requestCache, persist } = params;
    const cacheEntry: CacheEntry = {
        time: new Date(),
        timeout: timeoutSeconds,
        data: value,
    };

    requestCache.set(requestKey, cacheEntry);
    await persist([...requestCache.entries()]);
}
