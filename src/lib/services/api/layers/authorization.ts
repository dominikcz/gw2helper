const REQUIRED_SCOPES: Record<string, string[]> = {
    '/v2/account': ['account' /*, 'progression' */],
    '/v2/account/achievements': ['account', 'progression'],
    '/v2/account/bank': ['account', 'inventories'],
    '/v2/account/inventory': ['account', 'inventories'],
    '/v2/account/legendaryarmory': ['account', 'inventories', 'unlocks'],
    '/v2/account/materials': ['account', 'inventories'],
    '/v2/account/wallet': ['account', 'wallet'],
    '/v2/account/wizardsvault/*': ['account', 'progression'],
    '/v2/characters': ['account', 'characters'],
    '/v2/commerce': ['account', 'tradingpost'],
    '/v2/guild/*': ['account', 'guilds'],
};

export function getScopes(req: string): string[] {
    if (REQUIRED_SCOPES[req]) return REQUIRED_SCOPES[req];
    const prefix = Object.keys(REQUIRED_SCOPES).find((key) => req.startsWith(key.replace('*', '')));
    return prefix ? REQUIRED_SCOPES[prefix] : [];
}

export interface ApiScopeError extends Error {
    missingScopes: string[];
}

export function createScopeError(missingScopes: string[]): ApiScopeError {
    const error = new Error(`Missing permissions: ${missingScopes.join(', ')}`) as ApiScopeError;
    error.name = 'ScopeError';
    error.missingScopes = missingScopes;
    return error;
}
