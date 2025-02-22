export function autoTooltipInit(node, options) {
    if (options && options.customRenderers){
        Object.assign(window.__autotooltip.customRenderers, options.customRenderers);
    }
    let count = 0;
    node ??= document;
    node.querySelectorAll('.autotooltip [title], .autotooltip[title], .autotooltip[data-autotooltip-id], autotooltip [data-autotooltip-id]').forEach((elem) => {
        const t = elem.getAttribute('title');
        const id = elem.getAttribute('data-autotooltip-id');
        if ((t || id) && !elem.getAttribute('data-autotooltip')) {
            elem.setAttribute('title', '');
            elem.setAttribute('data-autotooltip', t);
            count++;
        }
    });
    // console.log('autotooltip', count, node);
}

