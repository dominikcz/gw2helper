import { sum } from '$lib/utils';
import type { LegendariesData, LegendaryItemSummary, LegendaryTrinketsBySubtype } from '$lib/types/gw2-api';

export const minReqWeapons: Record<string, number> = {
	Axe: 2,
	Dagger: 2,
	Focus: 1,
	Greatsword: 1,
	Hammer: 1,
	'Harpoon gun': 1,
	'Long bow': 1,
	Mace: 2,
	Pistol: 2,
	Rifle: 1,
	Scepter: 1,
	Shield: 1,
	'Short bow': 1,
	Spear: 1,
	Staff: 1,
	Sword: 2,
	Torch: 1,
	Trident: 1,
	Warhorn: 1,
};

export function sumCount(items: LegendaryItemSummary[]): number {
	return sum(items as unknown as Record<string, unknown>[], 'count');
}

export function done(items: LegendaryItemSummary[], minReq: number): boolean {
	return sumCount(items) >= minReq;
}

type ArmorGroup = LegendariesData['armor']['Light'];

export function completionArmor(data: ArmorGroup): number {
	let completed = 0;
	if (sumCount(data['Helm'] as LegendaryItemSummary[])) completed++;
	if (sumCount(data['Shoulders'] as LegendaryItemSummary[])) completed++;
	if (sumCount(data['Coat'] as LegendaryItemSummary[])) completed++;
	if (sumCount(data['Gloves'] as LegendaryItemSummary[])) completed++;
	if (sumCount(data['Leggings'] as LegendaryItemSummary[])) completed++;
	if (sumCount(data['Boots'] as LegendaryItemSummary[])) completed++;
	return completed;
}

export function completionTrinkets(data: { back: LegendaryItemSummary[]; trinkets: LegendaryTrinketsBySubtype }): number {
	let completed = 0;
	if (sumCount(data.back)) completed++;
	if (sumCount(data.trinkets.Accessory)) completed++;
	completed += Math.min(2, sumCount(data.trinkets.Ring));
	if (sumCount(data.trinkets.Amulet)) completed++;
	return completed;
}

export function completionUpgrades(data: { upgrades: LegendaryItemSummary[] }): number {
	return sumCount(data.upgrades);
}

export function completionWeapons(data: Record<string, LegendaryItemSummary[]>): number {
	let completed = 0;
	Object.keys(minReqWeapons).forEach((x) => {
		completed += Math.min(minReqWeapons[x], sumCount(data[x] ?? []));
	});
	return completed;
}
