import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Linkable from '$lib/components/linkable.svelte';
import Wiki from '$lib/components/wiki.svelte';
import WidgetImg from '$lib/components/widgets/widgetImg.svelte';
import WidgetsGroup from '$lib/components/widgets/widgetsGroup.svelte';
import AstralAcclaim from '$lib/components/astralAcclaim.svelte';

describe('Linkable', () => {
	it('renders anchor when link is provided', () => {
		const view = render(Linkable, {
			props: {
				link: 'https://example.com/wiki/test',
				linkTitle: 'open wiki',
				'aria-label': 'wiki-link',
			},
		});

		expect(view.body).toContain('<a ');
		expect(view.body).toContain('href="https://example.com/wiki/test"');
		expect(view.body).toContain('title="open wiki"');
		expect(view.body).toContain('target="_blank"');
		expect(view.body).toContain('aria-label="wiki-link"');
	});

	it('does not render anchor when link is empty', () => {
		const view = render(Linkable, {
			props: {
				link: '',
			},
		});

		expect(view.body).not.toContain('<a ');
	});
});

describe('Wiki', () => {
	it('renders default dimensions', () => {
		const view = render(Wiki);
		expect(view.body).toContain('width="128"');
		expect(view.body).toContain('height="128"');
		expect(view.body).toContain('viewBox="0 0 128 128"');
	});

	it('renders custom dimensions and forwards attributes', () => {
		const view = render(Wiki, {
			props: {
				width: 48,
				height: 64,
				'aria-label': 'wiki-icon',
			},
		});
		expect(view.body).toContain('width="48"');
		expect(view.body).toContain('height="64"');
		expect(view.body).toContain('aria-label="wiki-icon"');
	});
});

describe('WidgetImg', () => {
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

describe('WidgetsGroup', () => {
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

describe('AstralAcclaim', () => {
	it('renders wiki link and image', () => {
		const view = render(AstralAcclaim);
		expect(view.body).toMatch(/class="[^"]*tooltip-link[^"]*"/);
		expect(view.body).toContain('href="https://wiki.guildwars2.com/wiki/Astral_Acclaim"');
		expect(view.body).toContain('target="_blank"');
		expect(view.body).toContain('Astral_Acclaim.png');
	});

	it('renders image alt text', () => {
		const view = render(AstralAcclaim);
		expect(view.body).toContain('alt="Astral Acclaim"');
	});
});
