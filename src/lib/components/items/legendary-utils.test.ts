import { describe, expect, it } from 'vitest';
import {
	minReqWeapons,
	sumCount,
	done,
	completionArmor,
	completionTrinkets,
	completionUpgrades,
	completionWeapons,
} from '$lib/components/items/legendary-utils';
import type { LegendaryItemSummary } from '$lib/types/gw2-api';

function makeItem(count: number): LegendaryItemSummary {
	return { id: 1, name: 'Test', icon: '/t.png', max_count: 1, count };
}

describe('legendary-utils', () => {
	describe('sumCount', () => {
		it('returns 0 for empty array', () => {
			expect(sumCount([])).toBe(0);
		});

		it('sums count values', () => {
			expect(sumCount([makeItem(2), makeItem(3)])).toBe(5);
		});

		it('returns single item count', () => {
			expect(sumCount([makeItem(1)])).toBe(1);
		});
	});

	describe('done', () => {
		it('returns true when count meets minReq', () => {
			expect(done([makeItem(1)], 1)).toBe(true);
		});

		it('returns true when count exceeds minReq', () => {
			expect(done([makeItem(3)], 2)).toBe(true);
		});

		it('returns false when count below minReq', () => {
			expect(done([makeItem(1)], 2)).toBe(false);
		});

		it('returns false for empty array', () => {
			expect(done([], 1)).toBe(false);
		});
	});

	describe('completionArmor', () => {
		it('returns 0 when all slots empty', () => {
			const emptyGroup = { Helm: [], Shoulders: [], Coat: [], Gloves: [], Leggings: [], Boots: [], HelmAquatic: [] };
			expect(completionArmor(emptyGroup)).toBe(0);
		});

		it('counts completed armor slots', () => {
			const group = {
				Helm: [makeItem(1)],
				Shoulders: [makeItem(1)],
				Coat: [],
				Gloves: [makeItem(1)],
				Leggings: [],
				Boots: [],
				HelmAquatic: [],
			};
			expect(completionArmor(group)).toBe(3);
		});

		it('returns 6 when all main slots filled', () => {
			const full = { Helm: [makeItem(1)], Shoulders: [makeItem(1)], Coat: [makeItem(1)], Gloves: [makeItem(1)], Leggings: [makeItem(1)], Boots: [makeItem(1)], HelmAquatic: [] };
			expect(completionArmor(full)).toBe(6);
		});
	});

	describe('completionTrinkets', () => {
		it('returns 0 for empty data', () => {
			const data = { back: [], trinkets: { Accessory: [], Ring: [], Amulet: [] } };
			expect(completionTrinkets(data)).toBe(0);
		});

		it('counts back item', () => {
			const data = { back: [makeItem(1)], trinkets: { Accessory: [], Ring: [], Amulet: [] } };
			expect(completionTrinkets(data)).toBe(1);
		});

		it('caps ring count at 2', () => {
			const data = { back: [], trinkets: { Accessory: [], Ring: [makeItem(5)], Amulet: [] } };
			expect(completionTrinkets(data)).toBe(2);
		});

		it('counts all trinket slots', () => {
			const data = {
				back: [makeItem(1)],
				trinkets: { Accessory: [makeItem(1)], Ring: [makeItem(2)], Amulet: [makeItem(1)] },
			};
			expect(completionTrinkets(data)).toBe(5);
		});
	});

	describe('completionUpgrades', () => {
		it('returns 0 for empty upgrades', () => {
			expect(completionUpgrades({ upgrades: [] })).toBe(0);
		});

		it('sums upgrade counts', () => {
			expect(completionUpgrades({ upgrades: [makeItem(2), makeItem(1)] })).toBe(3);
		});
	});

	describe('completionWeapons', () => {
		it('returns 0 for empty weapons', () => {
			expect(completionWeapons({})).toBe(0);
		});

		it('counts single weapon', () => {
			expect(completionWeapons({ Axe: [makeItem(1)] })).toBe(1);
		});

		it('caps at minReq per weapon type (Axe max=2)', () => {
			expect(completionWeapons({ Axe: [makeItem(5)] })).toBe(2);
		});

		it('counts multiple weapon types', () => {
			const weapons = { Axe: [makeItem(2)], Greatsword: [makeItem(1)] };
			expect(completionWeapons(weapons)).toBe(3);
		});
	});

	describe('minReqWeapons', () => {
		it('has correct requirement for Axe (2)', () => {
			expect(minReqWeapons['Axe']).toBe(2);
		});

		it('has correct requirement for Greatsword (1)', () => {
			expect(minReqWeapons['Greatsword']).toBe(1);
		});

		it('has 19 weapon types', () => {
			expect(Object.keys(minReqWeapons)).toHaveLength(19);
		});
	});
});
