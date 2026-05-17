import { groupBy, mapFields } from '$lib/utils/helper-utils';
import type { LegendariesData, LegendaryItemSummary } from '$lib/types/gw2-api';

type LegendaryEntry = {
    id: number;
    type?: string;
    subtype?: string;
    description?: string;
    icon?: string;
    name?: string;
    rarity?: string;
    max_count?: number;
    count?: number;
    details?: Record<string, unknown>;
    [key: string]: unknown;
};

function normalizeWeaponSubtype(entry: LegendaryEntry): void {
    if (entry.subtype === 'Harpoon') entry.subtype = 'Spear';
    else if (entry.subtype === 'Speargun') entry.subtype = 'Harpoon gun';
    else if (entry.subtype === 'LongBow') entry.subtype = 'Long bow';
    else if (entry.subtype === 'ShortBow') entry.subtype = 'Short bow';
}

export function buildLegendariesData(data: LegendaryEntry[]): LegendariesData {
    const armor = groupBy(data.filter((x) => x.type === 'Armor'), ['details.weight_class', 'subtype'], ['id', 'name', 'icon', 'max_count', 'count', 'rarity']) as unknown as LegendariesData['armor'];
    const trinkets = groupBy(data.filter((x) => x.type === 'Trinket' && x.id !== 95093), ['subtype'], ['id', 'name', 'description', 'icon', 'max_count', 'count', 'rarity']) as unknown as LegendariesData['trinkets'];
    const back = data.filter((x) => x.type === 'Back').map((x) => mapFields(x, ['id', 'name', 'description', 'icon', 'max_count', 'count', 'rarity']) as unknown as LegendaryItemSummary);
    const upgrades = data
        .filter((x) => ['Rune', 'Sigil'].includes(String(x.subtype)) || x.type === 'Relic')
        .map((x) => mapFields(x, ['id', 'name', 'description', 'icon', 'max_count', 'count', 'rarity', { equipped: true }]) as unknown as LegendaryItemSummary);
    const weaponsData = data.filter((x) => x.type === 'Weapon');
    weaponsData.forEach(normalizeWeaponSubtype);
    const weapons = groupBy(weaponsData, ['subtype'], ['id', 'name', 'description', 'icon', 'max_count', 'count', 'rarity']) as unknown as LegendariesData['weapons'];

    return { armor, trinkets, back, upgrades, weapons };
}
