import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import AchievementFilters from './achievementFilters.svelte';
import { defaultFilters, applySettings, type AchievFilterState } from './achievementFiltersUtils';

function makeFilters(): AchievFilterState {
	return { ...defaultFilters };
}

describe('AchievementFilters', () => {
	it('renders a fieldset', () => {
		const filters = makeFilters();
		const { body } = render(AchievementFilters, { props: { filters } });
		expect(body).toMatch(/<fieldset/);
	});

	it('renders 14 checkboxes', () => {
		const filters = makeFilters();
		const { body } = render(AchievementFilters, { props: { filters } });
		const count = (body.match(/type="checkbox"/g) ?? []).length;
		expect(count).toBe(14);
	});

	it('renders 3 radio buttons for sortBy', () => {
		const filters = makeFilters();
		const { body } = render(AchievementFilters, { props: { filters } });
		const count = (body.match(/type="radio"/g) ?? []).length;
		expect(count).toBe(3);
	});

	it('renders save button', () => {
		const filters = makeFilters();
		const { body } = render(AchievementFilters, { props: { filters } });
		expect(body).toMatch(/<button/);
	});
});

describe('applySettings', () => {
	it('applies defined settings to filters', () => {
		const filters = makeFilters();
		applySettings(filters, { withPoints: true, sortBy: 'name' });
		expect(filters.withPoints).toBe(true);
		expect(filters.sortBy).toBe('name');
	});

	it('does not overwrite with undefined values', () => {
		const filters = makeFilters();
		applySettings(filters, { notCompleted: undefined });
		expect(filters.notCompleted).toBe(true); // default value preserved
	});

	it('ignores unknown keys', () => {
		const filters = makeFilters();
		applySettings(filters, { unknownKey: true } as never);
		expect(filters.notCompleted).toBe(true);
	});
});

describe('defaultFilters', () => {
	it('has notCompleted=true by default', () => {
		expect(defaultFilters.notCompleted).toBe(true);
	});

	it('has sortBy=ap by default', () => {
		expect(defaultFilters.sortBy).toBe('ap');
	});

	it('has all boolean flags false except notCompleted', () => {
		const boolFields = Object.entries(defaultFilters)
			.filter(([k]) => k !== 'notCompleted' && k !== 'sortBy')
			.map(([, v]) => v);
		expect(boolFields.every((v) => v === false)).toBe(true);
	});
});
