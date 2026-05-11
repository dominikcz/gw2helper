import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import Currencies from '$lib/components/currencies/currencies.svelte';
import Currency from '$lib/components/currencies/currency.svelte';
import Price from '$lib/components/currencies/price.svelte';

function buildCurrency(overrides = {}) {
	return {
		id: 3,
		name: 'Laurel',
		icon: 'https://example.com/laurel.png',
		value: 1234,
		description: 'Sample description',
		...overrides,
	};
}

describe('currencies', () => {
	describe('currencies', () => {
		it('renders general wallet list with links', () => {
			const items = [buildCurrency({ id: 1, name: 'Coin', value: 12345 }), buildCurrency({ id: 2, name: 'Karma' })];
			const { container } = render(Currencies, { props: { items } });
			const wallet = container.querySelector('.wallet');
			expect(wallet).toBeInTheDocument();
			expect(wallet).toHaveClass('autotooltip');
			expect(container.querySelector('a[href="https://wiki.guildwars2.com/wiki/Coin"]')).toBeInTheDocument();
			expect(container.querySelector('a[href="https://wiki.guildwars2.com/wiki/Karma"]')).toBeInTheDocument();
		});
	});

	describe('price', () => {
		it('renders split into gold/silver/copper when compact is disabled', () => {
			const { container } = render(Price, { props: { value: 12345, compact: false } });
			expect(container.querySelector('.gold')).toHaveTextContent('1');
			expect(container.querySelector('.silver')).toHaveTextContent('23');
			expect(container.querySelector('.copper')).toHaveTextContent('45');
		});

		it('renders only gold for exact gold amount in compact mode', () => {
			const { container } = render(Price, { props: { value: 10000, compact: true } });
			expect(container.querySelector('.gold')).toHaveTextContent('1');
			expect(container.querySelector('.silver')).not.toBeInTheDocument();
			expect(container.querySelector('.copper')).not.toBeInTheDocument();
		});

		it('renders zero as copper', () => {
			const { container } = render(Price, { props: { value: 0 } });
			expect(container.querySelector('.copper')).toHaveTextContent('0');
		});
	});

	describe('currency', () => {
		it('renders drag handle and dynamic aria-label', () => {
			const { container } = render(Currency, { props: { currency: buildCurrency({ name: 'Test Currency' }) } });
			expect(container.querySelector('.handle')).toBeInTheDocument();
			expect(container.querySelector('[aria-label="drag-handle for Test Currency"]')).toBeInTheDocument();
		});

		describe('gold', () => {
			it('renders coin value using Price component markup', () => {
				const { container } = render(Currency, { props: { currency: buildCurrency({ id: 1, name: 'Coin', value: 12345 }) } });
				expect(container.querySelector('.price')).toBeInTheDocument();
				expect(container.querySelector('.gold')).toHaveTextContent('1');
			});
		});

		describe('karma', () => {
			it('renders numeric value with karma class', () => {
				const { container } = render(Currency, { props: { currency: buildCurrency({ id: 2, name: 'Karma', value: 4444 }) } });
				expect(container.querySelector('.karma')).toHaveTextContent('4,444');
			});
		});

		describe('gems', () => {
			it('renders numeric value with gems class', () => {
				const { container } = render(Currency, { props: { currency: buildCurrency({ id: 4, name: 'Gem', value: 999 }) } });
				expect(container.querySelector('.gems')).toHaveTextContent('999');
			});
		});

		describe('other', () => {
			it('renders numeric value without karma/gems classes', () => {
				const { container } = render(Currency, { props: { currency: buildCurrency({ id: 3, name: 'Laurel', value: 1200 }) } });
				expect(container.querySelector('.karma')).not.toBeInTheDocument();
				expect(container.querySelector('.gems')).not.toBeInTheDocument();
				expect(container).toHaveTextContent('1,200');
			});
		});
	});
});
