import apiService from "$lib/apiService";
import AchievementProgress from "./achievementProgress.svelte";
import { mount, unmount } from "svelte";

type AchievementBit = {
    id?: number;
    type?: string;
    text?: string;
};

type CachedEntity = {
    name?: string;
    icon?: string;
};

type AchievementData = {
    type: string;
    bits: AchievementBit[];
    done?: boolean;
};

type RendererPayload = number[] | { bitsDone?: number[]; done?: boolean } | undefined;

type ApiServiceLike = {
    achievementsCache: (id: string | number) => AchievementData;
    itemsCache: (id: number) => CachedEntity;
    minisCache: (id: number) => CachedEntity;
    skinsCache: (id: number) => CachedEntity;
    hydrateAchievementBits: (bits: AchievementBit[]) => Promise<unknown>;
};

const api = apiService as unknown as ApiServiceLike;

function toRendererPayload(bitsDone: unknown): RendererPayload {
    if (Array.isArray(bitsDone)) {
        return bitsDone as number[];
    }
    if (bitsDone && typeof bitsDone === 'object') {
        const payload = bitsDone as { bitsDone?: unknown; done?: unknown };
        return {
            bitsDone: Array.isArray(payload.bitsDone) ? payload.bitsDone as number[] : [],
            done: typeof payload.done === 'boolean' ? payload.done : undefined,
        };
    }
    return undefined;
}

export function achievProgressRenderer(node: HTMLElement, id: string | number | null, bitsDone: unknown) {
    if (id == null || id === '') return false;

    const achievId = Number(id);
    if (!Number.isFinite(achievId) || achievId === 0) return false;

    const achiev = api.achievementsCache(achievId);
    if (!achiev.bits) return false;

    const parsedBitsDone = toRendererPayload(bitsDone);

    const params = Array.isArray(parsedBitsDone)
        ? { bitsDone: parsedBitsDone, done: !!achiev?.done }
        : {
            bitsDone: Array.isArray(parsedBitsDone?.bitsDone) ? parsedBitsDone.bitsDone : [],
            done: typeof parsedBitsDone?.done === 'boolean' ? parsedBitsDone.done : !!achiev?.done,
        };

    const props = {
        type: achiev.type,
        bits: achiev.bits,
        bitsDone: params.bitsDone,
        done: params.done,
        itemsCache: api.itemsCache,
        minisCache: api.minisCache,
        skinsCache: api.skinsCache,
    };

    let destroyed = false;

    let component = mount(AchievementProgress as never, {
        props,
        target: node,
    });

    // Lazy hydration: only fetch bit entities when tooltip is actually rendered.
    api.hydrateAchievementBits(achiev.bits)
        .then(() => {
            if (destroyed) return;
            unmount(component);
            component = mount(AchievementProgress as never, {
                props,
                target: node,
            });
        })
        .catch(() => {
            // Keep currently rendered tooltip; fallback icons will still be shown.
        });

    return {
        update() { },
        destroy() {
            destroyed = true;
            unmount(component);
        },
    };
}
