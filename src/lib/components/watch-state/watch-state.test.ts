import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import WatchState from '$lib/components/watch-state/watch-state.svelte';

describe('watch-state', () => {
	describe('watch-state', () => {
		it('renders button with title and aria-label', () => {
			const { getByRole } = render(WatchState, {
				props: { watched: false, title: 'Click to watch', onClick: () => {} },
			});
			const btn = getByRole('button', { name: 'watched state' });
			expect(btn).toHaveAttribute('title', 'Click to watch');
		});

		it('renders watched class when watched is true', () => {
			const { container } = render(WatchState, {
				props: { watched: true, title: 'Click to unwatch', onClick: () => {} },
			});
			expect(container.querySelector('button')).toHaveClass('watched');
		});

		it('does not render watched class when watched is false', () => {
			const { container } = render(WatchState, {
				props: { watched: false, title: 'Click to watch', onClick: () => {} },
			});
			const btn = container.querySelector('button');
			expect(btn).toHaveClass('watched-state');
			expect(btn).not.toHaveClass('watched');
		});
	});
});
