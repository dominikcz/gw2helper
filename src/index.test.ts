import { describe, it, expect } from 'vitest';
import { render } from 'svelte/server';
import AchievementProgress from '$lib/components/achievements/achievementProgress.svelte';
import ArrowBack from '$lib/components/arrowBack.svelte';
import ArrowForward from '$lib/components/arrowForward.svelte';
import Price from '$lib/components/price.svelte';
import Progress from '$lib/components/progress/progress.svelte';
import WidgetInfo from '$lib/components/widgets/widgetInfo.svelte';

describe('AchievementProgress', () => {
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

describe('ArrowBack', () => {
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

describe('ArrowForward', () => {
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

describe('Price', () => {
	it('renders split into gold/silver/copper when compact is disabled', () => {
		const view = render(Price, { props: { value: 12345, compact: false } });
			expect(view.body).toContain('class="gold">1</span>');
			expect(view.body).toContain('class="silver">23</span>');
			expect(view.body).toContain('class="copper">45</span>');
	});

	it('renders only gold for exact gold amount in compact mode', () => {
		const view = render(Price, { props: { value: 10000, compact: true } });
			expect(view.body).toContain('class="gold">1</span>');
			expect(view.body).not.toContain('class="silver">00</span>');
			expect(view.body).not.toContain('class="copper">00</span>');
	});

	it('renders zero as copper', () => {
		const view = render(Price, { props: { value: 0 } });
			expect(view.body).toContain('class="copper">0</span>');
	});
});

describe('WidgetInfo', () => {
	it('renders title, value and background image', () => {
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

	it('renders html value content', () => {
		const view = render(WidgetInfo, {
			props: {
				title: 'Coins',
				value: '<strong>42</strong>',
			},
		});

		expect(view.body).toContain('<strong>42</strong>');
	});
});

describe('Progress', () => {
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
