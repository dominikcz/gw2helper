import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import SearchInput from '$lib/components/search/searchInput.svelte';

describe('search', () => {
	describe('searchInput', () => {
		it('renders search input element', () => {
			const { container } = render(SearchInput, { props: { id: 'test-search' } });
			expect(container.querySelector('input[type="search"]')).toBeInTheDocument();
		});

		it('renders with initial value', () => {
			const { container } = render(SearchInput, { props: { value: 'test query', id: 'search-val' } });
			const input = container.querySelector('input[type="search"]') as HTMLInputElement;
			expect(input.value).toBe('test query');
		});

		it('renders custom id', () => {
			const { container } = render(SearchInput, { props: { id: 'my-search' } });
			expect(container.querySelector('input[type="search"]')).toHaveAttribute('id', 'my-search');
		});

		it('renders dropdown button when options are provided', () => {
			const { getByRole } = render(SearchInput, {
				props: { options: ['alpha', 'beta', 'gamma'], id: 'search-opts' },
			});
			expect(getByRole('button', { name: 'list' })).toBeInTheDocument();
		});

		it('does not render dropdown button when options are empty', () => {
			const { container } = render(SearchInput, { props: { options: [], id: 'search-empty' } });
			expect(container.querySelector('button[aria-label="list"]')).not.toBeInTheDocument();
		});

		it('forwards rest props', () => {
			const { container } = render(SearchInput, { props: { placeholder: 'Search...', id: 'search-ph' } });
			expect(container.querySelector('input[type="search"]')).toHaveAttribute('placeholder', 'Search...');
		});
	});

	describe('searchHelp', () => {
		it('loads module', async () => {
			const mod = await import('$lib/components/search/searchHelp.svelte');
			expect(mod.default).toBeTruthy();
		});
	});
});
