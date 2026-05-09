import apiService from "$lib/apiService";
import AchievementProgress from "./achievementProgress.svelte";
import { mount, unmount } from "svelte";

export function achievProgressRenderer(node, id, bitsDone) {
    if (!id) return false;

    const achiev = apiService.achievementsCache(id);
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
        itemsCache: apiService.itemsCache,
        minisCache: apiService.minisCache,
        skinsCache: apiService.skinsCache,
    };

    let destroyed = false;

    let component = mount(AchievementProgress, {
        props,
        target: node,
    });

    // Lazy hydration: only fetch bit entities when tooltip is actually rendered.
    apiService.hydrateAchievementBits(achiev.bits)
        .then(() => {
            if (destroyed) return;
            unmount(component);
            component = mount(AchievementProgress, {
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
