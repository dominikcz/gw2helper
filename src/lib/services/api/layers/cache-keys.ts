export const buildRequestCacheName = (base: string, apiKey: string): string => {
    return `${base}.${apiKey}`;
};

export const currentApiLang = (apiLang: string | undefined): string => {
    return apiLang || 'en';
};

export const buildEntityCacheName = (base: string, apiLang: string | undefined): string => {
    return `${base}.${currentApiLang(apiLang)}`;
};
