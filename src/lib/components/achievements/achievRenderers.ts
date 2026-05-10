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
    achievementsCache: (id: number) => AchievementData;
    itemsCache: (id: number) => CachedEntity;
    minisCache: (id: number) => CachedEntity;
    skinsCache: (id: number) => CachedEntity;
    hydrateAchievementBits: (bits: AchievementBit[]) => Promise<unknown>;
};

const api = apiService as unknown as ApiServiceLike;

export function achievProgressRenderer(node: HTMLElement, id: number | null, bitsDone: RendererPayload) {
    if (!id) return false;

    const achiev = api.achievementsCache(id);
    if (!achiev.bits) return false;

    const params = Array.isArray(bitsDone)
        ? { bitsDone, done: !!achiev?.done }
        : {
            bitsDone: Array.isArray(bitsDone?.bitsDone) ? bitsDone.bitsDone : [],
            done: typeof bitsDone?.done === 'boolean' ? bitsDone.done : !!achiev?.done,
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
