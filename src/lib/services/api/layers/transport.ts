export function withLanguageQuery(query: string, apiLang: string): string {
    return query ? `lang=${apiLang}&${query}` : `lang=${apiLang}`;
}

export function toScopeRequest(req: string | RequestInfo): string {
    if (typeof req === 'string') return req;
    if (req instanceof Request) return req.url;
    return String(req);
}

export function toRequestKey(req: string | RequestInfo, queryWithLang: string): string {
    return `${req}${queryWithLang}`;
}

export function toAbsoluteRequest(req: string | RequestInfo, baseURL: string): string | RequestInfo {
    if (typeof req === 'string') {
        return baseURL + req;
    }
    return req;
}

export function toAuthorizedUrl(req: string | RequestInfo, apiKey: string, queryWithLang: string): string {
    return `${req}?access_token=${apiKey}${queryWithLang ? '&' : ''}${queryWithLang}`;
}

export async function throwApiResponseError(response: Response): Promise<never> {
    const body = await response.text();
    if (response.headers.get('content-type')?.includes('application/json')) {
        let errorMsg = '';
        try {
            errorMsg = JSON.parse(body)?.text || '';
        } catch {
            errorMsg = '';
        }
        throw new Error(errorMsg !== '' ? errorMsg : body);
    }
    throw new Error(body);
}

export async function decodeApiResponseData<T = unknown>(response: Response, expectJson: boolean, transform?: (data: unknown) => unknown): Promise<T> {
    let data: unknown;
    if (expectJson) {
        data = await response.json();
    } else {
        data = await response.text();
    }

    if (transform) {
        data = transform(data);
    }

    return data as T;
}
