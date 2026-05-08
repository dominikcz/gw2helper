import { autoTooltipInit } from "$lib/components/autotooltip/autotooltip-utils";

/**
 * @param {HTMLElement} node
 * @param {{ customRenderers?: Record<string, (...args: any[]) => any> }} [options]
 */
export function autotooltip(node, options) {
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
        /**
         * @param {{ customRenderers?: Record<string, (...args: any[]) => any> }} [nextOptions]
         */
        update(nextOptions) {
            options = nextOptions;
            autoTooltipInit(node, options);
        },
        destroy() {
            observer.disconnect();
        }
    };
}
