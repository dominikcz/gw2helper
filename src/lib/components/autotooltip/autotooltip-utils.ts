export type AutoTooltipRenderer = (container: HTMLElement, id: string | number | null, params: unknown) => unknown;
type AutoTooltipState = { customRenderers: Record<string, AutoTooltipRenderer> };
export type AutoTooltipOptions = { customRenderers?: Record<string, AutoTooltipRenderer> };

/**
 * @param {Window & typeof globalThis & { __autotooltip?: AutoTooltipState }} currentWindow
 */
function getAutoTooltipState(currentWindow: Window & typeof globalThis & { __autotooltip?: AutoTooltipState }) {
    return currentWindow.__autotooltip;
}

export function autoTooltipInit(node: ParentNode | Document = document, options?: AutoTooltipOptions) {
    const autoTooltipState = getAutoTooltipState(window);

    if (options && options.customRenderers && autoTooltipState){
        Object.assign(autoTooltipState.customRenderers, options.customRenderers);
    }
    let count = 0;
    node.querySelectorAll('.autotooltip [title], .autotooltip[title], .autotooltip[data-autotooltip-id], .autotooltip [data-autotooltip-id]').forEach((elem: Element) => {
        const t = elem.getAttribute('title');
        const id = elem.getAttribute('data-autotooltip-id');
        if ((t && t.length > 0) || (id && !elem.hasAttribute('data-autotooltip'))) {
            elem.setAttribute('title', '');
            elem.setAttribute('data-autotooltip', t || '');
            count++;
        }
    });
    // console.log('autotooltip', count, node);
}

