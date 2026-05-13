import ItemTooltip from "./itemTooltip.svelte";
import { mount, unmount } from "svelte";
import apiService from "$lib/apiService";
import type { ItemRendererParams, ItemTooltipData } from "$lib/types/items";

type ApiServiceLike = {
    itemsCache: (id: string | number) => ItemTooltipData | null | undefined;
};

const api = apiService as unknown as ApiServiceLike;

function toRendererParams(params: unknown): ItemRendererParams {
    if (params && typeof params === 'object') {
        const raw = params as { count?: unknown; detailsHref?: unknown };
        return {
            count: typeof raw.count === 'number' ? raw.count : undefined,
            detailsHref: typeof raw.detailsHref === 'string' ? raw.detailsHref : undefined,
        };
    }
    return {};
}

export function itemTooltipRenderer(node: HTMLElement, id: string | number | null, params: unknown) {
    if (id == null || id === '') return false;

    const itemId = Number(id);
    if (!Number.isFinite(itemId) || itemId === 0) return false;

    const item = api.itemsCache(itemId);
    if (!item) return false;
    const rendererParams = toRendererParams(params);
    const tooltipItem = {
        ...item,
        count: rendererParams.count ?? item.count,
        detailsHref: rendererParams.detailsHref,
    };
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
