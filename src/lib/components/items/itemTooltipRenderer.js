import ItemTooltip from "./itemTooltip.svelte";
import { mount, unmount } from "svelte";
import apiService from "$lib/apiService";

export function itemTooltipRenderer(node, id, params) {
    if (!id) return false;

    const item = apiService.itemsCache(id);
    if (!item) return false;
    const tooltipItem = { ...item, count: params?.count ?? item.count };
    let component = mount(ItemTooltip, {
            props: { item: tooltipItem },
            target: node,
        });

    return {
        update() { },
        destroy() {
            unmount(component);
        },
    };
}
