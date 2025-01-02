import ItemTooltip from "./itemTooltip.svelte";
import { mount, unmount } from "svelte";

export function itemTooltipRenderer(node, item) {
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
