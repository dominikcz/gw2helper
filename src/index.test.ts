import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import ArrowBack from '$lib/components/arrowBack.svelte';
import ArrowForward from '$lib/components/arrowForward.svelte';
import Price from '$lib/components/price.svelte';
import Progress from '$lib/components/progress/progress.svelte';
import WidgetInfo from '$lib/components/widgets/widgetInfo.svelte';
import AchievementProgress from '$lib/components/achievements/achievementProgress.svelte';

describe('Visual Components', () => {
	it('renders arrow icons with requested dimensions', () => {
		const back = render(ArrowBack, { props: { width: 32, height: 40 } });
		expect(back.body).toContain('width="32px"');
		expect(back.body).toContain('height="40px"');

		const next = render(ArrowForward, { props: { width: 48, height: 16 } });
		expect(next.body).toContain('width="48px"');
		expect(next.body).toContain('height="16px"');
	});

	it('renders price split into gold/silver/copper', () => {
		const view = render(Price, { props: { value: 12345, compact: false } });
		expect(view.body).toContain('class="gold">1</span>');
		expect(view.body).toContain('class="silver">23</span>');
		expect(view.body).toContain('class="copper">45</span>');
	});

	it('renders widget title and value', () => {
		const view = render(WidgetInfo, {
			props: {
				title: 'Astral Acclaim',
				value: '1234',
				image: '/assets/rewards/Astral_Acclaim.png',
			},
		});

		expect(view.body).toContain('Astral Acclaim');
		expect(view.body).toContain('1234');
		expect(view.body).toContain('background-image: url(/assets/rewards/Astral_Acclaim.png);');
	});

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
	});

	it('renders achievement text progress with done states', () => {
		const view = render(AchievementProgress, {
			props: {
				type: 'Default',
				bits: [{ text: 'Step A' }, { text: 'Step B' }],
				bitsDone: [1],
			},
		});

		expect(view.body).toContain('>Step A</li>');
		expect(view.body).toContain('Step B</li>');
		expect(view.body).toContain(' done');
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
});
