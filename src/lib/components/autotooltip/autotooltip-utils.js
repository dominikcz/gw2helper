export function autoTooltipInit(node) {
    let count = 0;
    node ??= document;
    node.querySelectorAll('.autotooltip [title]').forEach((elem) => {
        const t = elem.getAttribute('title');
        elem.setAttribute('title', '');
        if (t && !elem.getAttribute('data-autotooltip')) {
            elem.setAttribute('data-autotooltip', t);
            count++;
        }
    });
    // console.log('autotooltip', count, node);
}

