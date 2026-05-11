import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import Progress from '$lib/components/progress/progress.svelte';

describe('progress', () => {
	describe('progress', () => {
		it('renders progress label and attributes', () => {
			const { container } = render(Progress, {
				props: { value: 30, max: 100, label: '30/100' },
			});
			const progressEl = container.querySelector('progress')!;
			expect(progressEl).toHaveAttribute('value', '30');
			expect(progressEl).toHaveAttribute('max', '100');
			expect(progressEl).toHaveAttribute('title', '30 / 100');
			expect(container).toHaveTextContent('30/100');
		});

		it('renders computed percentage label', () => {
			const { container } = render(Progress, {
				props: { value: 120, max: 100, label: 'percentage' },
			});
			const span = container.querySelector('span')!;
			expect(span).toHaveAttribute('title', '120 / 100');
			expect(span).toHaveTextContent('1');
		});
	});
});
