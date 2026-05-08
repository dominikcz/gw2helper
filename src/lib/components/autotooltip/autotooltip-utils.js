/** @typedef {{ customRenderers: Record<string, (...args: any[]) => any> }} AutoTooltipState */

/**
 * @param {Window & typeof globalThis & { __autotooltip?: AutoTooltipState }} currentWindow
 */
function getAutoTooltipState(currentWindow) {
    return currentWindow.__autotooltip;
}

/**
 * @param {ParentNode | Document} node
 * @param {{ customRenderers?: Record<string, (...args: any[]) => any> }} [options]
 */
export function autoTooltipInit(node, options) {
    const autoTooltipState = getAutoTooltipState(window);

    if (options && options.customRenderers && autoTooltipState){
        Object.assign(autoTooltipState.customRenderers, options.customRenderers);
    }
    let count = 0;
    node ??= document;
    node.querySelectorAll('.autotooltip [title], .autotooltip[title], .autotooltip[data-autotooltip-id], .autotooltip [data-autotooltip-id]').forEach((elem) => {
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

