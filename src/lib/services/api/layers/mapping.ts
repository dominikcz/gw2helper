type Dictionary = Record<string, unknown>;

type MappingEntry = {
    description?: string;
    details?: { type?: string; description?: string };
    subtype?: string;
    subdescr?: string;
    charges?: number;
    count?: number;
};

export const sanitizeApiHtml = (html: string): string => {
    const stripDangerous = (input: string) => input
        .replace(/<\/?(script|style|iframe|object|embed|meta|link)\b[^>]*>/gi, '')
        .replace(/\son\w+\s*=\s*(["']).*?\1/gi, '')
        .replace(/\son\w+\s*=\s*[^\s>]+/gi, '')
        .replace(/\s(?:href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\1/gi, '');

    if (typeof DOMParser === 'undefined') {
        return stripDangerous(html);
    }

    const parser = new DOMParser();
    const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
    const container = doc.body.firstElementChild as HTMLElement | null;
    if (!container) return '';

    const allowedTags = new Set(['a', 'b', 'br', 'div', 'em', 'i', 'li', 'ol', 'p', 'span', 'strong', 'u', 'ul']);
    const allowedAttrs = new Set(['class', 'href', 'rel', 'target']);

    const all = Array.from(container.querySelectorAll('*'));
    for (const element of all) {
        const tag = element.tagName.toLowerCase();
        if (!allowedTags.has(tag)) {
            const parent = element.parentNode;
            if (!parent) continue;
            while (element.firstChild) {
                parent.insertBefore(element.firstChild, element);
            }
            parent.removeChild(element);
            continue;
        }

        for (const attr of Array.from(element.attributes)) {
            const name = attr.name.toLowerCase();
            const value = attr.value;
            if (name.startsWith('on') || !allowedAttrs.has(name)) {
                element.removeAttribute(attr.name);
                continue;
            }
            if ((name === 'href') && /^\s*javascript:/i.test(value)) {
                element.removeAttribute(attr.name);
            }
        }

        if (tag === 'a') {
            element.setAttribute('rel', 'noreferrer noopener');
            if (element.getAttribute('target') !== '_blank') {
                element.removeAttribute('target');
            }
        }
    }

    return stripDangerous(container.innerHTML);
};

export const toHtml = (text: string | null): string => {
    let descr = text || '';
    descr = descr.replace(/<c=@flavor>/gi, '<span class="flavor">');
    descr = descr.replace(/<c=@warning>/gi, '<span class="warning">');
    descr = descr.replace(/<\/c>/gi, '</span>');
    return sanitizeApiHtml(descr);
};

export const additionalMapping = <T extends MappingEntry>(data: T[]): void => {
    data.forEach((element) => {
        if (element.charges) {
            element.count = element.charges;
        }
        element.description = toHtml(element.description ?? null);
        if (element.details) {
            if (element.details.type) {
                element.subtype = element.details.type;
            }
            if (element.details.description) {
                element.subdescr = toHtml(element.details.description);
            }
        }
    });
};
