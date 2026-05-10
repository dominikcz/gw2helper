import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Chip from '$lib/components/chips/chip.svelte';
import Chips from '$lib/components/chips/chips.svelte';

describe('chips', () => {
	describe('chip', () => {
		it('renders label text', () => {
			const view = render(Chip, {
				props: { label: 'Option A', value: 'a' },
			});
			expect(view.body).toMatch(/class="[^"]*formkit-chip[^"]*"/);
			expect(view.body).toContain('Option A');
		});

		it('renders data attributes', () => {
			const view = render(Chip, {
				props: { label: 'Option B', value: 42, name: 'myChip', id: 'chip-1', title: 'tooltip' },
			});
			expect(view.body).toContain('data-name="myChip"');
			expect(view.body).toContain('data-value="42"');
			expect(view.body).toContain('id="chip-1"');
			expect(view.body).toContain('title="tooltip"');
		});

		it('renders selected class when selected', () => {
			const view = render(Chip, {
				props: { label: 'Active', value: 'x', selected: true },
			});
			expect(view.body).toMatch(/class="[^"]*selected[^"]*"/);
		});

		it('does not render selected class by default', () => {
			const view = render(Chip, {
				props: { label: 'Inactive', value: 'y' },
			});
			expect(view.body).not.toMatch(/class="[^"]*selected[^"]*formkit-chip/);
		});
	});

	describe('chips', () => {
		it('renders container with options from object', () => {
			const view = render(Chips, {
				props: {
					options: { a: 'Alpha', b: 'Beta' },
				},
			});
			expect(view.body).toMatch(/class="[^"]*formkit-chips[^"]*"/);
			expect(view.body).toContain('Alpha');
			expect(view.body).toContain('Beta');
		});

		it('renders container with options from string array', () => {
			const view = render(Chips, {
				props: {
					options: ['One', 'Two', 'Three'],
				},
			});
			expect(view.body).toContain('One');
			expect(view.body).toContain('Two');
			expect(view.body).toContain('Three');
		});

		it('renders custom className', () => {
			const view = render(Chips, {
				props: {
					options: { a: 'A' },
					className: 'my-class',
				},
			});
			expect(view.body).toMatch(/class="[^"]*formkit-chips my-class[^"]*"/);
		});

		it('renders empty when no options', () => {
			const view = render(Chips);
			expect(view.body).toMatch(/class="[^"]*formkit-chips[^"]*"/);
		});
	});
});
