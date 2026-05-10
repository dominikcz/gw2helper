import { autoTooltipInit } from "$lib/components/autotooltip/autotooltip-utils";

type AutotooltipOptions = {
    customRenderers?: Record<string, (...args: any[]) => any>;
};

export function autotooltip(node: HTMLElement, options?: AutotooltipOptions) {
    autoTooltipInit(node, options);

    const observer = new MutationObserver(() => {
        autoTooltipInit(node, options);
    });

    observer.observe(node, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['title', 'data-autotooltip-id']
    });

    return {
        update(nextOptions?: AutotooltipOptions) {
            options = nextOptions;
            autoTooltipInit(node, options);
        },
        destroy() {
            observer.disconnect();
        }
    };
}
