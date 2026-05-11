import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import ArrowBack from '$lib/components/navigation/arrowBack.svelte';
import ArrowForward from '$lib/components/navigation/arrowForward.svelte';

describe('navigation', () => {
	describe('arrowBack', () => {
		it('renders default icon dimensions', () => {
			const { container } = render(ArrowBack);
			const svg = container.querySelector('svg')!;
			expect(svg).toHaveAttribute('width', '24px');
			expect(svg).toHaveAttribute('height', '24px');
		});

		it('renders requested icon dimensions', () => {
			const { container } = render(ArrowBack, { props: { width: 32, height: 40 } });
			const svg = container.querySelector('svg')!;
			expect(svg).toHaveAttribute('width', '32px');
			expect(svg).toHaveAttribute('height', '40px');
		});
	});

	describe('arrowForward', () => {
		it('renders default icon dimensions', () => {
			const { container } = render(ArrowForward);
			const svg = container.querySelector('svg')!;
			expect(svg).toHaveAttribute('width', '24px');
			expect(svg).toHaveAttribute('height', '24px');
		});

		it('renders requested icon dimensions', () => {
			const { container } = render(ArrowForward, { props: { width: 48, height: 16 } });
			const svg = container.querySelector('svg')!;
			expect(svg).toHaveAttribute('width', '48px');
			expect(svg).toHaveAttribute('height', '16px');
		});
	});
});
