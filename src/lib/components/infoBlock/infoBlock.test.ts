import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import InfoBlock from '$lib/components/infoBlock/infoBlock.svelte';

describe('infoBlock', () => {
	describe('infoBlock', () => {
		it('renders default caption and kind', () => {
			const view = render(InfoBlock);
			expect(view.body).toMatch(/class="[^"]*info-block info[^"]*"/);
			expect(view.body).toMatch(/<h4[^>]*>Hint<\/h4>/);
		});

		it('renders custom caption', () => {
			const view = render(InfoBlock, {
				props: { caption: 'Warning' },
			});
			expect(view.body).toMatch(/<h4[^>]*>Warning<\/h4>/);
		});

		it('renders error kind', () => {
			const view = render(InfoBlock, {
				props: { kind: 'error', caption: 'Error occurred' },
			});
			expect(view.body).toMatch(/class="[^"]*info-block error[^"]*"/);
			expect(view.body).toMatch(/<h4[^>]*>Error occurred<\/h4>/);
		});

		it('renders paragraph element for content', () => {
			const view = render(InfoBlock);
			expect(view.body).toMatch(/<p[^>]*>/);
		});
	});
});
