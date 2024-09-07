import ItemTooltip from "./itemTooltip.svelte";

export function itemTooltipRenderer(node, item) {
    let component = new ItemTooltip({
        props: { item },
        target: node,
    });

    return {
        update() { },
        destroy() {
            component.$destroy();
        },
    };
}
