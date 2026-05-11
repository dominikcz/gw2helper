import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import Chip from '$lib/components/chips/chip.svelte';
import Chips from '$lib/components/chips/chips.svelte';

describe('chips', () => {
	describe('chip', () => {
		it('renders label text', () => {
			const { container, getByText } = render(Chip, { props: { label: 'Option A', value: 'a' } });
			expect(container.querySelector('.formkit-chip')).toBeInTheDocument();
			expect(getByText('Option A')).toBeInTheDocument();
		});

		it('renders data attributes', () => {
			const { container } = render(Chip, {
				props: { label: 'Option B', value: 42, name: 'myChip', id: 'chip-1', title: 'tooltip' },
			});
			const el = container.querySelector('[data-name="myChip"]')!;
			expect(el).toBeInTheDocument();
			expect(el).toHaveAttribute('data-value', '42');
			expect(el).toHaveAttribute('id', 'chip-1');
			expect(el).toHaveAttribute('title', 'tooltip');
		});

		it('renders selected class when selected', () => {
			const { container } = render(Chip, { props: { label: 'Active', value: 'x', selected: true } });
			expect(container.querySelector('.formkit-chip')).toHaveClass('selected');
		});

		it('does not render selected class by default', () => {
			const { container } = render(Chip, { props: { label: 'Inactive', value: 'y' } });
			expect(container.querySelector('.formkit-chip')).not.toHaveClass('selected');
		});
	});

	describe('chips', () => {
		it('renders container with options from object', () => {
			const { container, getByText } = render(Chips, { props: { options: { a: 'Alpha', b: 'Beta' } } });
			expect(container.querySelector('.formkit-chips')).toBeInTheDocument();
			expect(getByText('Alpha')).toBeInTheDocument();
			expect(getByText('Beta')).toBeInTheDocument();
		});

		it('renders container with options from string array', () => {
			const { getByText } = render(Chips, { props: { options: ['One', 'Two', 'Three'] } });
			expect(getByText('One')).toBeInTheDocument();
			expect(getByText('Two')).toBeInTheDocument();
			expect(getByText('Three')).toBeInTheDocument();
		});

		it('renders custom className', () => {
			const { container } = render(Chips, { props: { options: { a: 'A' }, className: 'my-class' } });
			const el = container.querySelector('.formkit-chips')!;
			expect(el).toHaveClass('formkit-chips', 'my-class');
		});

		it('renders empty when no options', () => {
			const { container } = render(Chips);
			expect(container.querySelector('.formkit-chips')).toBeInTheDocument();
		});
	});
});
