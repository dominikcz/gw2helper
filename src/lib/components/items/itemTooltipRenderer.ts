import ItemTooltip from "./itemTooltip.svelte";
import { mount, unmount } from "svelte";
import apiService from "$lib/apiService";

type ItemData = {
    id?: number;
    count?: number;
    name?: string;
    icon?: string;
    rarity?: string;
    locked?: boolean;
    [key: string]: unknown;
};

type RendererParams = {
    count?: number;
};

type ApiServiceLike = {
    itemsCache: (id: number) => ItemData | null | undefined;
};

const api = apiService as unknown as ApiServiceLike;

export function itemTooltipRenderer(node: HTMLElement, id: number | null, params?: RendererParams) {
    if (!id) return false;

    const item = api.itemsCache(id);
    if (!item) return false;
    const tooltipItem = { ...item, count: params?.count ?? item.count };
    const component = mount(ItemTooltip as never, {
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
