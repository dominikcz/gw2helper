import { describe, expect, it, vi } from 'vitest';
import { render } from 'svelte/server';
import SearchInput from '$lib/components/search/searchInput.svelte';

describe('search', () => {
	describe('searchInput', () => {
		it('renders search input element', () => {
			const view = render(SearchInput, { props: { id: 'test-search' } });
			expect(view.body).toContain('<input type="search"');
		});

		it('renders with initial value', () => {
			const view = render(SearchInput, {
				props: { value: 'test query', id: 'search-val' },
			});
			expect(view.body).toContain('value="test query"');
		});

		it('renders custom id', () => {
			const view = render(SearchInput, {
				props: { id: 'my-search' },
			});
			expect(view.body).toContain('id="my-search"');
		});

		it('renders dropdown button when options are provided', () => {
			const view = render(SearchInput, {
				props: { options: ['alpha', 'beta', 'gamma'], id: 'search-opts' },
			});
			expect(view.body).toContain('aria-label="list"');
		});

		it('does not render dropdown button when options are empty', () => {
			const view = render(SearchInput, {
				props: { options: [], id: 'search-empty' },
			});
			expect(view.body).not.toContain('aria-label="list"');
		});

		it('forwards rest props', () => {
			const view = render(SearchInput, {
				props: { placeholder: 'Search...', id: 'search-ph' },
			});
			expect(view.body).toContain('placeholder="Search..."');
		});
	});

	describe('searchHelp', () => {
		it('loads module', async () => {
			const mod = await import('$lib/components/search/searchHelp.svelte');
			expect(mod.default).toBeTruthy();
		});
	});
});
