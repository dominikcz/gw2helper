import { describe, expect, it } from 'vitest';
import { normalizeLookupName, pickBestSearchItem, uniqueLookupNames, type WikiSearchItem } from '$lib/utils/wikiImport';

function item(id: number, name: string): WikiSearchItem {
	return { id, name, icon: null, rarity: 'Basic' };
}

describe('wikiImport utils', () => {
	it('normalizes names for case-insensitive lookup', () => {
		expect(normalizeLookupName('  Mystic Coin  ')).toBe('mystic coin');
	});

	it('deduplicates lookup names preserving first original form', () => {
		expect(uniqueLookupNames([' Mystic Coin ', 'mystic coin', 'Glob of Ectoplasm'])).toEqual([
			'Mystic Coin',
			'Glob of Ectoplasm',
		]);
	});

	it('prefers exact name match over first search result', () => {
		const result = pickBestSearchItem([
			item(1, 'Mystic Clover'),
			item(2, 'Mystic Coin'),
		], 'mystic coin');
		expect(result?.id).toBe(2);
	});

	it('falls back to first search result when exact match is unavailable', () => {
		const result = pickBestSearchItem([
			item(7, 'Charged Quartz Crystal'),
			item(8, 'Quartz Crystal'),
		], 'Quartz Core');
		expect(result?.id).toBe(7);
	});
});