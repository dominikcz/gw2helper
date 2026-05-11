import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import CharacterCard from '$lib/components/characters/characterCard.svelte';

const mockChar = {
	name: 'Aegnor',
	profession: 'Ranger',
	race: 'Sylvari',
	gender: 'Male',
	level: 80,
	age: 3_600_000,
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
			const { container } = render(CharacterCard, { props: { char: mockChar } });
			expect(container.querySelector('summary')).toHaveTextContent('Aegnor');
		});

		it('renders profession and level', () => {
			const { container } = render(CharacterCard, { props: { char: mockChar } });
			expect(container).toHaveTextContent('Ranger');
			expect(container).toHaveTextContent('lvl. 80');
		});

		it('renders profession icon path', () => {
			const { container } = render(CharacterCard, { props: { char: mockChar } });
			expect(container.querySelector('img[src*="Ranger_icon.png"]')).toBeInTheDocument();
		});

		it('renders race and gender', () => {
			const { container } = render(CharacterCard, { props: { char: mockChar } });
			expect(container).toHaveTextContent('Male');
			expect(container).toHaveTextContent('Sylvari');
		});

		it('renders crafting disciplines and ratings', () => {
			const { container } = render(CharacterCard, { props: { char: mockChar } });
			expect(container).toHaveTextContent('Armorsmith');
			expect(container).toHaveTextContent('500');
			expect(container).toHaveTextContent('Leatherworker');
			expect(container).toHaveTextContent('400');
		});

		it('renders deaths count', () => {
			const { container } = render(CharacterCard, { props: { char: mockChar } });
			expect(container).toHaveTextContent('42');
		});

		it('renders open details element', () => {
			const { container } = render(CharacterCard, { props: { char: mockChar } });
			expect(container.querySelector('details[open]')).toBeInTheDocument();
		});

		it('renders fallback profession when missing', () => {
			const { container } = render(CharacterCard, { props: { char: { ...mockChar, profession: undefined } } });
			expect(container.querySelector('img[src*="Warrior_icon.png"]')).toBeInTheDocument();
		});

		it('renders gravestone and birthday images', () => {
			const { container } = render(CharacterCard, { props: { char: mockChar } });
			expect(container.querySelector('img[src*="Grave_Finisher.png"]')).toBeInTheDocument();
			expect(container.querySelector('img[src*="Present_quaggan_icon.png"]')).toBeInTheDocument();
		});

		it('renders character with empty crafting list', () => {
			const { container } = render(CharacterCard, { props: { char: { ...mockChar, crafting: [] } } });
			expect(container.querySelector('summary')).toHaveTextContent(mockChar.name);
		});
	});
});
