import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import CharacterCard from '$lib/components/characters/characterCard.svelte';

const mockChar = {
	name: 'Aegnor',
	profession: 'Ranger',
	race: 'Sylvari',
	gender: 'Male',
	level: 80,
	age: 3_600_000, // seconds
	deaths: 42,
	created: '2020-01-01T00:00:00Z',
	crafting: [
		{ discipline: 'Armorsmith', rating: 500, active: true },
		{ discipline: 'Leatherworker', rating: 400, active: false },
	],
};

describe('characters', () => {
	describe('characterCard', () => {
		it('renders character name in summary', () => {
			const view = render(CharacterCard, { props: { char: mockChar } });
			expect(view.body).toContain('<summary>Aegnor</summary>');
		});

		it('renders profession and level', () => {
			const view = render(CharacterCard, { props: { char: mockChar } });
			expect(view.body).toContain('Ranger');
			expect(view.body).toContain('lvl. 80');
		});

		it('renders profession icon path', () => {
			const view = render(CharacterCard, { props: { char: mockChar } });
			expect(view.body).toContain('Ranger_icon.png');
		});

		it('renders race and gender', () => {
			const view = render(CharacterCard, { props: { char: mockChar } });
			expect(view.body).toContain('Male');
			expect(view.body).toContain('Sylvari');
		});

		it('renders crafting disciplines and ratings', () => {
			const view = render(CharacterCard, { props: { char: mockChar } });
			expect(view.body).toContain('Armorsmith');
			expect(view.body).toContain('500');
			expect(view.body).toContain('Leatherworker');
			expect(view.body).toContain('400');
		});

		it('renders deaths count', () => {
			const view = render(CharacterCard, { props: { char: mockChar } });
			expect(view.body).toContain('42');
		});

		it('renders open details element', () => {
			const view = render(CharacterCard, { props: { char: mockChar } });
			expect(view.body).toContain('<details');
			expect(view.body).toContain('open');
		});

		it('renders fallback profession when missing', () => {
			const view = render(CharacterCard, {
				props: { char: { ...mockChar, profession: undefined } },
			});
			expect(view.body).toContain('Warrior_icon.png');
			expect(view.body).toContain('-');
		});

		it('renders gravestone and birthday images', () => {
			const view = render(CharacterCard, { props: { char: mockChar } });
			expect(view.body).toContain('Grave_Finisher.png');
			expect(view.body).toContain('Present_quaggan_icon.png');
		});

		it('renders character with empty crafting list', () => {
			const view = render(CharacterCard, {
				props: { char: { ...mockChar, crafting: [] } },
			});
			expect(view.body).toContain(mockChar.name);
		});
	});
});
