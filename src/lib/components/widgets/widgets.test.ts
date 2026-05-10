import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import WidgetImg from '$lib/components/widgets/widgetImg.svelte';
import WidgetInfo from '$lib/components/widgets/widgetInfo.svelte';
import WidgetsGroup from '$lib/components/widgets/widgetsGroup.svelte';

describe('widgets', () => {
	describe('widgetImg', () => {
		it('renders linked image with active class', () => {
			const view = render(WidgetImg, {
				props: {
					title: 'Wiki',
					url: '/assets/logo.svg',
					link: 'https://example.com',
					linkTitle: 'open',
					active: true,
					class: 'custom',
				},
			});

			expect(view.body).toMatch(/class="[^"]*widget image custom[^"]*"/);
			expect(view.body).toMatch(/<a[^>]*href="https:\/\/example.com"[^>]*title="open"[^>]*target="_blank"/);
			expect(view.body).toContain('<img src="/assets/logo.svg" alt="logo"');
			expect(view.body).toContain(' active"');
		});

		it('renders non-linked image when link is not provided', () => {
			const view = render(WidgetImg, {
				props: {
					title: 'Wiki',
					url: '/assets/logo.svg',
					active: false,
				},
			});

			expect(view.body).not.toContain('<a href=');
			expect(view.body).toContain('<div class="title">Wiki</div>');
		});
	});

	describe('widgetInfo', () => {
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

	describe('widgetsGroup', () => {
		it('renders wrapper and heading', () => {
			const view = render(WidgetsGroup, {
				props: {
					name: 'Stats',
				},
			});

			expect(view.body).toMatch(/class="[^"]*widgets-group[^"]*"/);
			expect(view.body).toMatch(/<h3[^>]*>Stats<\/h3>/);
			expect(view.body).toMatch(/class="[^"]*widgets[^"]*"/);
		});

		it('renders empty heading by default', () => {
			const view = render(WidgetsGroup);
			expect(view.body).toMatch(/<h3[^>]*><\/h3>/);
		});
	});
});
