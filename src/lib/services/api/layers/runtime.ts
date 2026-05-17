import Logger from '$lib/logger';

export interface TokenInfo {
    id: string;
    name: string;
    permissions: string[];
    missingScopes: string[];
    error: string | null;
}

export interface ApiClientOptions extends RequestInit {
    baseURL: string;
    timeout: number;
    expectJson: boolean;
    apiLang: string;
    onError(request: RequestInfo | string, response: Response, options: object): void;
    fetchFunction: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
    debug: boolean;
    transform?: (data: unknown) => unknown;
}

export type ApiRuntimeState = {
    apiKey: string;
    tokenInfo: TokenInfo;
    fetchOptions: ApiClientOptions;
};

export function createInitialTokenInfo(): TokenInfo {
    return {
        id: '',
        name: '',
        permissions: [],
        error: null,
        missingScopes: [],
    };
}

export function createDefaultApiClientOptions(params: {
    devMode: boolean;
    realApi: boolean;
    defaultApiUrl: string;
    mockApiUrl: string;
}): ApiClientOptions {
    const { devMode, realApi, defaultApiUrl, mockApiUrl } = params;
    return {
        method: 'GET',
        baseURL: devMode ? (realApi ? defaultApiUrl : mockApiUrl) : defaultApiUrl,
        timeout: 10000,
        expectJson: true,
        apiLang: 'en',
        onError(request: Request, response: Response, options: object) {
            Logger.error(`apiClient response error ${response?.status}: ${response?.statusText ? response?.statusText : '(HTTP status: ' + response?.status + ')'} \n req: ${JSON.stringify(request)}, options: ${JSON.stringify(options)}`, response);
        },
        fetchFunction: fetch,
        debug: false,
    };
}

export function createApiRuntimeState(fetchOptions: ApiClientOptions): ApiRuntimeState {
    return {
        apiKey: '',
        tokenInfo: createInitialTokenInfo(),
        fetchOptions,
    };
}

export function mergeApiClientOptions(current: ApiClientOptions, overrides?: Partial<ApiClientOptions>): ApiClientOptions {
    return Object.assign({}, current, overrides);
}

export function hasLanguageChanged(current: ApiClientOptions, next: ApiClientOptions): boolean {
    return next.apiLang !== current.apiLang;
}

export function shouldSkipInit(newApiKey: string, currentApiKey: string, languageChanged: boolean): boolean {
    return newApiKey === currentApiKey && !languageChanged;
}
