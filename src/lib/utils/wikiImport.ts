export interface WikiSearchItem {
	id: number;
	name: string;
	icon: string | null;
	rarity: string;
}

export function normalizeLookupName(value: string): string {
	return value.trim().toLowerCase();
}

export function uniqueLookupNames(values: string[]): string[] {
	const map = new Map<string, string>();
	for (const value of values) {
		const normalized = normalizeLookupName(value);
		if (!normalized || map.has(normalized)) continue;
		map.set(normalized, value.trim());
	}
	return [...map.values()];
}

export function pickBestSearchItem(items: WikiSearchItem[], expectedName: string): WikiSearchItem | undefined {
	if (!items.length) return undefined;
	const normalizedExpected = normalizeLookupName(expectedName);
	return items.find((item) => normalizeLookupName(item.name) === normalizedExpected) ?? items[0];
}