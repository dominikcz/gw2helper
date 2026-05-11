import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import AstralAcclaim from '$lib/components/branding/astralAcclaim.svelte';

describe('branding', () => {
	describe('astralAcclaim', () => {
		it('renders wiki link and image', () => {
			const { container } = render(AstralAcclaim);
			const link = container.querySelector('a')!;
			expect(link).toHaveClass('tooltip-link');
			expect(link).toHaveAttribute('href', 'https://wiki.guildwars2.com/wiki/Astral_Acclaim');
			expect(link).toHaveAttribute('target', '_blank');
			expect(container.querySelector('img[src*="Astral_Acclaim.png"]')).toBeInTheDocument();
		});

		it('renders image alt text', () => {
			const { container } = render(AstralAcclaim);
			expect(container.querySelector('img')).toHaveAttribute('alt', 'Astral Acclaim');
		});
	});
});
