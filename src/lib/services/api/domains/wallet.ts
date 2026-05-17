type CurrencyLike = {
    id: number;
    order: number;
    depreciated?: boolean;
    [key: string]: unknown;
};

export function buildDeprecatedCurrencyOverlay(): Array<{ depreciated: true; depreciationReason: string; id: number; active: 0 }> {
    const depreciated = [
        {
            reason: 'Replaced by "Tales of Dungeon Delving"',
            ids: [5, 6, 9, 10, 11, 12, 13, 14],
        },
        {
            reason: 'Replaced by "Blue Prophet Shard"',
            ids: [52, 53],
        },
        {
            reason: 'Replaced by "Blue Prophet Crystal"',
            ids: [55, 56],
        },
    ];

    return depreciated.flatMap(({ reason, ids }) => ids.map((id) => ({ depreciated: true as const, depreciationReason: reason, id, active: 0 as const })));
}

export function applyCurrencyOrder<T extends CurrencyLike>(currencies: T[], order: number[]): T[] {
    currencies.forEach((currency) => {
        const idx = order.findIndex((id) => id === currency.id);
        currency.order = (idx >= 0) ? idx : currency.depreciated ? currency.order + 20000 : currency.order + 10000;
    });
    return currencies.sort((a, b) => a.order - b.order);
}
