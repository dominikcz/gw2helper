import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Currencies from '$lib/components/currencies/currencies.svelte';
import Currency from '$lib/components/currencies/currency.svelte';
import Price from '$lib/components/currencies/price.svelte';

type CurrencyModel = {
	id: number;
	name: string;
	icon: string;
	value: number;
	description?: string;
	depreciated?: boolean;
	depreciationReason?: string;
};

function buildCurrency(overrides: Partial<CurrencyModel> = {}): CurrencyModel {
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
			const view = render(Currencies, { props: { items } });

				expect(view.body).toMatch(/class="[^"]*wallet[^"]*autotooltip[^"]*"/);
			expect(view.body).toContain('href="https://wiki.guildwars2.com/wiki/Coin"');
			expect(view.body).toContain('href="https://wiki.guildwars2.com/wiki/Karma"');
		});
	});

	describe('price', () => {
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

	describe('currency', () => {
		it('renders drag handle and dynamic aria-label', () => {
			const view = render(Currency, { props: { currency: buildCurrency({ name: 'Test Currency' }) } });
				expect(view.body).toMatch(/class="[^"]*handle[^"]*"/);
			expect(view.body).toContain('aria-label="drag-handle for Test Currency"');
		});

		describe('gold', () => {
			it('renders coin value using Price component markup', () => {
				const view = render(Currency, { props: { currency: buildCurrency({ id: 1, name: 'Coin', value: 12345 }) } });
				expect(view.body).toContain('class="price ');
				expect(view.body).toContain('class="gold">1</span>');
			});
		});

		describe('karma', () => {
			it('renders numeric value with karma class', () => {
				const view = render(Currency, { props: { currency: buildCurrency({ id: 2, name: 'Karma', value: 4444 }) } });
				expect(view.body).toContain('class="karma">4,444</span>');
			});
		});

		describe('gems', () => {
			it('renders numeric value with gems class', () => {
				const view = render(Currency, { props: { currency: buildCurrency({ id: 4, name: 'Gem', value: 999 }) } });
				expect(view.body).toContain('class="gems">999</span>');
			});
		});

		describe('other', () => {
			it('renders numeric value without karma/gems classes', () => {
				const view = render(Currency, { props: { currency: buildCurrency({ id: 3, name: 'Laurel', value: 1200 }) } });
				expect(view.body).toContain('>1,200</span>');
				expect(view.body).not.toContain('class="karma">');
				expect(view.body).not.toContain('class="gems">');
			});
		});
	});
});
