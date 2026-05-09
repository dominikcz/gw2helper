import apiService from "$lib/apiService";
import AchievementProgress from "./achievementProgress.svelte";
import { mount, unmount } from "svelte";

const DEBUG_ACHIEVEMENT_ID = 5541;

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

    if (Number(id) === DEBUG_ACHIEVEMENT_ID) {
        console.info('[achievements-tooltip-debug]', {
            id: Number(id),
            source: 'achievProgressRenderer',
            domParamType: Array.isArray(bitsDone) ? 'array' : typeof bitsDone,
            domParamBitsDoneLen: Array.isArray(bitsDone)
                ? bitsDone.length
                : (Array.isArray(bitsDone?.bitsDone) ? bitsDone.bitsDone.length : 0),
            domParamDone: typeof bitsDone?.done === 'boolean' ? bitsDone.done : null,
            effectiveDone: params.done,
            effectiveBitsDoneLen: Array.isArray(params.bitsDone) ? params.bitsDone.length : 0,
            achievementBitsLen: Array.isArray(achiev?.bits) ? achiev.bits.length : 0,
            achievementType: achiev?.type,
            achievementDone: achiev?.done,
        });
    }

    let component = mount(AchievementProgress, {
            props: { id: Number(id), type: achiev.type, bits: achiev.bits, bitsDone: params.bitsDone, done: params.done, itemsCache: apiService.itemsCache, minisCache: apiService.minisCache, skinsCache: apiService.skinsCache },
            target: node,
        });

    return {
        update() { },
        destroy() {
            unmount(component);
        },
    };
}
