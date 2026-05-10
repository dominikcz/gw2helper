import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import WatchState from '$lib/components/watch-state/watch-state.svelte';

describe('watch-state', () => {
	describe('watch-state', () => {
		it('renders button with title and aria-label', () => {
			const view = render(WatchState, {
				props: {
					watched: false,
					title: 'Click to watch',
					onClick: () => {},
				},
			});
			expect(view.body).toContain('<button');
			expect(view.body).toContain('title="Click to watch"');
			expect(view.body).toContain('aria-label="watched state"');
		});

		it('renders watched class when watched is true', () => {
			const view = render(WatchState, {
				props: {
					watched: true,
					title: 'Click to unwatch',
					onClick: () => {},
				},
			});
			expect(view.body).toMatch(/class="[^"]*watched[^"]*"/);
		});

		it('does not render watched class when watched is false', () => {
			const view = render(WatchState, {
				props: {
					watched: false,
					title: 'Click to watch',
					onClick: () => {},
				},
			});
			expect(view.body).not.toMatch(/class="[^"]*watched[^"]*watched-state[^"]*"/);
			expect(view.body).toMatch(/class="[^"]*watched-state[^"]*"/);
		});
	});
});
