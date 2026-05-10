import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import AchievementProgress from '$lib/components/achievements/achievementProgress.svelte';

describe('achievements', () => {
	describe('achievementProgress', () => {
		it('renders default text progress with done states by index', () => {
			const view = render(AchievementProgress, {
				props: {
					type: 'Default',
					bits: [{ text: 'Step A' }, { text: 'Step B' }],
					bitsDone: [1],
				},
			});

			expect(view.body).toContain('>Step A</li>');
			expect(view.body).toContain('>Step B</li>');
			expect(view.body).toContain(' done"');
		});

		it('marks default text progress as done by bit id', () => {
			const view = render(AchievementProgress, {
				props: {
					type: 'Default',
					bits: [{ id: 501, text: 'Collect relic' }, { id: 502, text: 'Return relic' }],
					bitsDone: [501],
				},
			});

			expect(view.body).toContain('Collect relic');
			expect(view.body).toContain(' done"');
		});

		it('renders item set icons and fallback for missing entries', () => {
			const itemsCache = (id: number) => (id === 1001 ? { name: 'Apple', icon: 'https://example.com/apple.png' } : {});
			const view = render(AchievementProgress, {
				props: {
					type: 'ItemSet',
					bits: [
						{ id: 1001, type: 'Item' },
						{ id: 1002, type: 'Item' },
					],
					bitsDone: [0],
					itemsCache,
				},
			});

			expect(view.body).toContain('https://example.com/apple.png');
			expect(view.body).toContain(' done"');
			expect(view.body).toContain('not found');
		});

		it('renders detailed item set with text labels', () => {
			const itemsCache = (id: number) => (id === 1001 ? { name: 'Apple', icon: 'https://example.com/apple.png' } : {});
			const view = render(AchievementProgress, {
				props: {
					type: 'ItemSet',
					detailed: true,
					bits: [{ id: 1001, type: 'Item' }, { id: 1002, type: 'Item', text: 'Missing item' }],
					itemsCache,
				},
			});

			expect(view.body).toContain('item-set-detailed');
			expect(view.body).toContain('Apple');
			expect(view.body).toContain('Missing item');
		});
	});
});
