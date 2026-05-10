import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Progress from '$lib/components/progress/progress.svelte';

describe('progress', () => {
	describe('progress', () => {
		it('renders progress label and attributes', () => {
			const view = render(Progress, {
				props: {
					value: 30,
					max: 100,
					label: '30/100',
				},
			});
			expect(view.body).toContain('<progress value="30" max="100"');
			expect(view.body).toContain('30/100');
			expect(view.body).toContain('title="30 / 100"');
		});

		it('renders computed percentage label', () => {
			const view = render(Progress, {
				props: {
					value: 120,
					max: 100,
					label: 'percentage',
				},
			});
			expect(view.body).toMatch(/<span[^>]*title="120 \/ 100"[^>]*>1<\/span>/);
		});
	});
});
