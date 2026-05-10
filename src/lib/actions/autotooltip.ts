import { autoTooltipInit } from "$lib/components/autotooltip/autotooltip-utils";
import type { AutoTooltipOptions as CoreAutoTooltipOptions } from "$lib/components/autotooltip/autotooltip-utils";

export function autotooltip(node: HTMLElement, options?: CoreAutoTooltipOptions) {
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
        update(nextOptions?: CoreAutoTooltipOptions) {
            options = nextOptions;
            autoTooltipInit(node, options);
        },
        destroy() {
            observer.disconnect();
        }
    };
}
