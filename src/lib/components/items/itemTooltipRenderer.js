import ItemTooltip from "./itemTooltip.svelte";
import { mount, unmount } from "svelte";
import apiService from "$lib/apiService";

export function itemTooltipRenderer(node, id) {
    if (!id) return;

    const item = apiService.itemsCache(id);
    let component = mount(ItemTooltip, {
            props: { item },
            target: node,
        });

    return {
        update() { },
        destroy() {
            unmount(component);
        },
    };
}
