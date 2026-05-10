import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import AstralAcclaim from '$lib/components/branding/astralAcclaim.svelte';

describe('branding', () => {
	describe('astralAcclaim', () => {
		it('renders wiki link and image', () => {
			const view = render(AstralAcclaim);
			expect(view.body).toMatch(/class="[^"]*tooltip-link[^"]*"/);
			expect(view.body).toContain('href="https://wiki.guildwars2.com/wiki/Astral_Acclaim"');
			expect(view.body).toContain('target="_blank"');
			expect(view.body).toContain('Astral_Acclaim.png');
		});

		it('renders image alt text', () => {
			const view = render(AstralAcclaim);
			expect(view.body).toContain('alt="Astral Acclaim"');
		});
	});
});
