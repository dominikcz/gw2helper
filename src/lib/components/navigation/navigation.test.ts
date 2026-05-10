import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import ArrowBack from '$lib/components/navigation/arrowBack.svelte';
import ArrowForward from '$lib/components/navigation/arrowForward.svelte';

describe('navigation', () => {
	describe('arrowBack', () => {
		it('renders default icon dimensions', () => {
			const view = render(ArrowBack);
			expect(view.body).toContain('width="24px"');
			expect(view.body).toContain('height="24px"');
		});

		it('renders requested icon dimensions', () => {
			const view = render(ArrowBack, { props: { width: 32, height: 40 } });
			expect(view.body).toContain('width="32px"');
			expect(view.body).toContain('height="40px"');
		});
	});

	describe('arrowForward', () => {
		it('renders default icon dimensions', () => {
			const view = render(ArrowForward);
			expect(view.body).toContain('width="24px"');
			expect(view.body).toContain('height="24px"');
		});

		it('renders requested icon dimensions', () => {
			const view = render(ArrowForward, { props: { width: 48, height: 16 } });
			expect(view.body).toContain('width="48px"');
			expect(view.body).toContain('height="16px"');
		});
	});
});
