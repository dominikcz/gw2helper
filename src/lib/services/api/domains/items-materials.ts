type ItemRef = {
    id: number;
    count?: number;
    upgrades?: number[];
    infusions?: number[];
    [key: string]: unknown;
};

type CharacterLike = {
    bags?: Array<{ id: number; inventory?: Array<ItemRef | null> } | null>;
    equipment?: Array<ItemRef | null>;
};

export function normalizeNonNullItems<T>(data: Array<T | null | undefined>): T[] {
    return data.filter((x): x is T => x != null);
}

export function collectItemIds<T extends { id: number }>(items: T[]): number[] {
    return items.map((x) => x.id);
}

export function buildCharacterItemCollection(character: CharacterLike): ItemRef[] {
    const bags = normalizeNonNullItems(character.bags || []).map((x) => ({ id: x.id, count: 1 }));
    const itemsInBags = normalizeNonNullItems(normalizeNonNullItems(character.bags || []).map((bag) => bag.inventory).flat());
    const equipment = normalizeNonNullItems(character.equipment || []).map((x) => ({ ...x, count: 1, equipped: true }));

    const baseItems: ItemRef[] = [...bags, ...itemsInBags, ...equipment];
    const addons: number[] = [];
    baseItems.forEach((item) => {
        addons.push(...(item.upgrades || []), ...(item.infusions || []));
    });

    return [...baseItems, ...addons.map((id) => ({ id, count: 1, equipped: true }))];
}
