import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import Item from '$lib/components/items/item.svelte';
import Legendary from '$lib/components/items/legendary.svelte';
import ItemTooltip from '$lib/components/items/itemTooltip.svelte';

describe('items', () => {
	describe('item', () => {
		it('renders item image with wiki link', () => {
			const { container } = render(Item, {
				props: { item: { id: 123, name: 'Eternity', icon: 'https://example.com/eternity.png', rarity: 'Legendary', count: 1 } },
			});
			expect(container.querySelector('a')).toHaveAttribute('href', 'https://wiki.guildwars2.com/wiki/Eternity');
			expect(container.querySelector('img')).toHaveAttribute('alt', 'Eternity');
			expect(container.querySelector('img')).toHaveAttribute('src', 'https://example.com/eternity.png');
			const rarityEl = container.querySelector('.rarity-legendary')!;
			expect(rarityEl).toBeInTheDocument();
			expect(rarityEl).toHaveClass('rarity');
		});

		it('renders fallback for item without name', () => {
			const { container } = render(Item, { props: { item: { id: 999, count: 0 } } });
			expect(container.querySelector('img')).toHaveAttribute('alt', 'invalid id: 999');
			expect(container).toHaveTextContent('id: 999');
		});

		it('renders count when greater than 1', () => {
			const { container } = render(Item, { props: { item: { id: 1, name: 'Coin', icon: '/coin.png', count: 5 } } });
			expect(container.querySelector('figcaption')).toHaveTextContent('5');
		});

		it('does not render count when 1 or less', () => {
			const { container } = render(Item, { props: { item: { id: 1, name: 'Coin', icon: '/coin.png', count: 1 } } });
			expect(container.querySelector('figcaption')).not.toBeInTheDocument();
		});

		it('renders locked class when locked', () => {
			const { container } = render(Item, { props: { item: { id: 1, name: 'Test', icon: '/test.png', count: 1, locked: true } } });
			expect(container.querySelector('.locked')).toBeInTheDocument();
		});

		it('renders rarity class in lowercase', () => {
			const { container } = render(Item, { props: { item: { id: 1, name: 'Test', icon: '/t.png', rarity: 'Exotic', count: 1 } } });
			expect(container.querySelector('.rarity-exotic')).toBeInTheDocument();
		});
	});

	describe('legendary', () => {
		it('renders wiki link and image', () => {
			const { container } = render(Legendary, {
				props: { item: { id: 1, name: 'Sunrise', icon: '/sunrise.png', count: 1, max_count: 1 } },
			});
			expect(container.querySelector('a')).toHaveAttribute('href', 'https://wiki.guildwars2.com/wiki/Sunrise');
			expect(container.querySelector('img')).toHaveAttribute('alt', 'Sunrise');
			expect(container.querySelector('img')).toHaveAttribute('src', '/sunrise.png');
		});

		it('renders count/max when max_count > 1 and item is owned', () => {
			const { container } = render(Legendary, {
				props: { item: { id: 2, name: 'Bolt', icon: '/bolt.png', count: 2, max_count: 3 } },
			});
			expect(container.querySelector('figcaption')).toHaveTextContent('2/3');
		});

		it('does not render count when max_count is 1', () => {
			const { container } = render(Legendary, {
				props: { item: { id: 3, name: 'Incinerator', icon: '/inc.png', count: 1, max_count: 1 } },
			});
			expect(container.querySelector('figcaption')).not.toBeInTheDocument();
		});

		it('renders locked class when count is 0', () => {
			const { container } = render(Legendary, {
				props: { item: { id: 4, name: 'Twilight', icon: '/twi.png', count: 0, max_count: 1 } },
			});
			expect(container.querySelector('.locked')).toBeInTheDocument();
		});

		it('does not render locked class when count > 0', () => {
			const { container } = render(Legendary, {
				props: { item: { id: 5, name: 'Twilight', icon: '/twi.png', count: 1, max_count: 1 } },
			});
			expect(container.querySelector('.locked')).not.toBeInTheDocument();
		});

		it('sets autotooltip renderer attribute', () => {
			const { container } = render(Legendary, {
				props: { item: { id: 6, name: 'Test', icon: '/t.png', count: 1, max_count: 1 } },
			});
			const el = container.querySelector('[data-autotooltip-renderer="img.item"]')!;
			expect(el).toBeInTheDocument();
			expect(el).toHaveAttribute('data-autotooltip-id', '6');
		});
	});

	describe('itemTooltip', () => {
		it('renders item name and image', () => {
			const { container, getByText } = render(ItemTooltip, {
				props: { item: { id: 10, name: 'Eternity', icon: '/eternity.png', rarity: 'Legendary' } },
			});
			expect(container.querySelector('img')).toHaveAttribute('alt', 'Eternity');
			expect(container.querySelector('img')).toHaveAttribute('src', '/eternity.png');
			expect(getByText('Eternity')).toBeInTheDocument();
			expect(container.querySelector('.rarity-legendary')).toBeInTheDocument();
		});

		it('renders description html', () => {
			const { container } = render(ItemTooltip, {
				props: { item: { id: 11, name: 'Test', icon: '/t.png', description: '<em>A powerful weapon</em>' } },
			});
			expect(container.querySelector('em')).toHaveTextContent('A powerful weapon');
		});

		it('renders required level', () => {
			const { container } = render(ItemTooltip, {
				props: { item: { id: 12, name: 'Sword', icon: '/s.png', level: 80 } },
			});
			expect(container).toHaveTextContent('Required level: 80');
		});

		it('renders flags', () => {
			const { container } = render(ItemTooltip, {
				props: { item: { id: 13, name: 'Sword', icon: '/s.png', flags: ['AccountBound', 'SoulbindOnAcquire'] } },
			});
			expect(container).toHaveTextContent('AccountBound, SoulbindOnAcquire');
		});

		it('renders item count when greater than 1', () => {
			const { container } = render(ItemTooltip, {
				props: { item: { id: 14, name: 'Material', icon: '/m.png', count: 250 } },
			});
			expect(container).toHaveTextContent('250');
		});
	});

	describe('itemsList', () => {
		it('loads module', async () => {
			const mod = await import('$lib/components/items/itemsList.svelte');
			expect(mod.default).toBeTruthy();
		});
	});
});
