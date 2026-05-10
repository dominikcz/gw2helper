import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import Item from '$lib/components/items/item.svelte';
import Legendary from '$lib/components/items/legendary.svelte';
import ItemTooltip from '$lib/components/items/itemTooltip.svelte';

describe('items', () => {
	describe('item', () => {
		it('renders item image with wiki link', () => {
			const view = render(Item, {
				props: {
					item: {
						id: 123,
						name: 'Eternity',
						icon: 'https://example.com/eternity.png',
						rarity: 'Legendary',
						count: 1,
					},
				},
			});
			expect(view.body).toContain('href="https://wiki.guildwars2.com/wiki/Eternity"');
			expect(view.body).toContain('alt="Eternity"');
			expect(view.body).toContain('src="https://example.com/eternity.png"');
			expect(view.body).toMatch(/class="[^"]*rarity rarity-legendary[^"]*"/);
		});

		it('renders fallback for item without name', () => {
			const view = render(Item, {
				props: {
					item: { id: 999, count: 0 },
				},
			});
			expect(view.body).toContain('alt="invalid id: 999"');
			expect(view.body).toContain('id: 999');
		});

		it('renders count when greater than 1', () => {
			const view = render(Item, {
				props: {
					item: { id: 1, name: 'Coin', icon: '/coin.png', count: 5 },
				},
			});
			expect(view.body).toMatch(/<figcaption[^>]*>5<\/figcaption>/);
		});

		it('does not render count when 1 or less', () => {
			const view = render(Item, {
				props: {
					item: { id: 1, name: 'Coin', icon: '/coin.png', count: 1 },
				},
			});
			expect(view.body).not.toMatch(/<figcaption>1<\/figcaption>/);
		});

		it('renders locked class when locked', () => {
			const view = render(Item, {
				props: {
					item: { id: 1, name: 'Test', icon: '/test.png', count: 1, locked: true },
				},
			});
			expect(view.body).toMatch(/class="[^"]*locked[^"]*"/);
		});

		it('renders rarity class in lowercase', () => {
			const view = render(Item, {
				props: {
					item: { id: 1, name: 'Test', icon: '/t.png', rarity: 'Exotic', count: 1 },
				},
			});
			expect(view.body).toMatch(/class="[^"]*rarity-exotic[^"]*"/);
		});
	});

	describe('legendary', () => {
		it('renders wiki link and image', () => {
			const view = render(Legendary, {
				props: {
					item: { id: 1, name: 'Sunrise', icon: '/sunrise.png', count: 1, max_count: 1 },
				},
			});
			expect(view.body).toContain('href="https://wiki.guildwars2.com/wiki/Sunrise"');
			expect(view.body).toContain('alt="Sunrise"');
			expect(view.body).toContain('src="/sunrise.png"');
		});

		it('renders count/max when max_count > 1 and item is owned', () => {
			const view = render(Legendary, {
				props: {
					item: { id: 2, name: 'Bolt', icon: '/bolt.png', count: 2, max_count: 3 },
				},
			});
			expect(view.body).toMatch(/<figcaption[^>]*>2\/3<\/figcaption>/);
		});

		it('does not render count when max_count is 1', () => {
			const view = render(Legendary, {
				props: {
					item: { id: 3, name: 'Incinerator', icon: '/inc.png', count: 1, max_count: 1 },
				},
			});
			expect(view.body).not.toContain('<figcaption>');
		});

		it('renders locked class when count is 0', () => {
			const view = render(Legendary, {
				props: {
					item: { id: 4, name: 'Twilight', icon: '/twi.png', count: 0, max_count: 1 },
				},
			});
			expect(view.body).toMatch(/class="[^"]*locked[^"]*"/);
		});

		it('does not render locked class when count > 0', () => {
			const view = render(Legendary, {
				props: {
					item: { id: 5, name: 'Twilight', icon: '/twi.png', count: 1, max_count: 1 },
				},
			});
			expect(view.body).not.toMatch(/class="[^"]*locked[^"]*"/);
		});

		it('sets autotooltip renderer attribute', () => {
			const view = render(Legendary, {
				props: {
					item: { id: 6, name: 'Test', icon: '/t.png', count: 1, max_count: 1 },
				},
			});
			expect(view.body).toContain('data-autotooltip-renderer="img.item"');
			expect(view.body).toContain('data-autotooltip-id="6"');
		});
	});

	describe('itemTooltip', () => {
		it('renders item name and image', () => {
			const view = render(ItemTooltip, {
				props: {
					item: {
						id: 10,
						name: 'Eternity',
						icon: '/eternity.png',
						rarity: 'Legendary',
					},
				},
			});
			expect(view.body).toContain('alt="Eternity"');
			expect(view.body).toContain('src="/eternity.png"');
			expect(view.body).toContain('Eternity');
			expect(view.body).toMatch(/class="[^"]*rarity-legendary[^"]*"/);
		});

		it('renders description html', () => {
			const view = render(ItemTooltip, {
				props: {
					item: {
						id: 11,
						name: 'Test',
						icon: '/t.png',
						description: '<em>A powerful weapon</em>',
					},
				},
			});
			expect(view.body).toContain('<em>A powerful weapon</em>');
		});

		it('renders required level', () => {
			const view = render(ItemTooltip, {
				props: {
					item: { id: 12, name: 'Sword', icon: '/s.png', level: 80 },
				},
			});
			expect(view.body).toContain('Required level: 80');
		});

		it('renders flags', () => {
			const view = render(ItemTooltip, {
				props: {
					item: { id: 13, name: 'Sword', icon: '/s.png', flags: ['AccountBound', 'SoulbindOnAcquire'] },
				},
			});
			expect(view.body).toContain('AccountBound, SoulbindOnAcquire');
		});

		it('renders item count when greater than 1', () => {
			const view = render(ItemTooltip, {
				props: {
					item: { id: 14, name: 'Material', icon: '/m.png', count: 250 },
				},
			});
			expect(view.body).toContain('250');
		});
	});

	describe('itemsList', () => {
		it('loads module', async () => {
			const mod = await import('$lib/components/items/itemsList.svelte');
			expect(mod.default).toBeTruthy();
		});
	});
});
