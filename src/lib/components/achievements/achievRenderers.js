import apiService from "$lib/apiService";
import AchievementProgress from "./achievementProgress.svelte";
import { mount, unmount } from "svelte";

export function achievProgressRenderer(node, id, bitsDone) {
    if (!id) return false;

    const achiev = apiService.achievementsCache(id);
    if (!achiev.bits) return false;

    let component = mount(AchievementProgress, {
            props: { type: achiev.type, bits: achiev.bits, bitsDone, itemsCache: apiService.itemsCache, minisCache: apiService.minisCache, skinsCache: apiService.skinsCache },
            target: node,
        });

    return {
        update() { },
        destroy() {
            unmount(component);
        },
    };
}
