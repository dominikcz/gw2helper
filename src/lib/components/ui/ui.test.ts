import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Linkable from '$lib/components/ui/linkable.svelte';
import Wiki from '$lib/components/ui/wiki.svelte';

describe('ui', () => {
	describe('linkable', () => {
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

	describe('wiki', () => {
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
});
