import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import Linkable from '$lib/components/ui/linkable.svelte';
import Wiki from '$lib/components/ui/wiki.svelte';

describe('ui', () => {
	describe('linkable', () => {
		it('renders anchor when link is provided', () => {
			const { getByRole } = render(Linkable, {
				props: { link: 'https://example.com/wiki/test', linkTitle: 'open wiki', 'aria-label': 'wiki-link' },
			});
			const anchor = getByRole('link');
			expect(anchor).toHaveAttribute('href', 'https://example.com/wiki/test');
			expect(anchor).toHaveAttribute('title', 'open wiki');
			expect(anchor).toHaveAttribute('target', '_blank');
			expect(anchor).toHaveAttribute('aria-label', 'wiki-link');
		});

		it('does not render anchor when link is empty', () => {
			const { container } = render(Linkable, { props: { link: '' } });
			expect(container.querySelector('a')).not.toBeInTheDocument();
		});
	});

	describe('wiki', () => {
		it('renders default dimensions', () => {
			const { container } = render(Wiki);
			const svg = container.querySelector('svg')!;
			expect(svg).toHaveAttribute('width', '128');
			expect(svg).toHaveAttribute('height', '128');
			expect(svg).toHaveAttribute('viewBox', '0 0 128 128');
		});

		it('renders custom dimensions and forwards attributes', () => {
			const { container } = render(Wiki, {
				props: { width: 48, height: 64, 'aria-label': 'wiki-icon' },
			});
			const svg = container.querySelector('svg')!;
			expect(svg).toHaveAttribute('width', '48');
			expect(svg).toHaveAttribute('height', '64');
			expect(svg).toHaveAttribute('aria-label', 'wiki-icon');
		});
	});
});
