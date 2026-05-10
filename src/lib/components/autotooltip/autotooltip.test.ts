import { describe, expect, it } from 'vitest';

describe('autotooltip', () => {
	describe('autotooltip-utils', () => {
		it('exports autoTooltipInit function', async () => {
			const mod = await import('$lib/components/autotooltip/autotooltip-utils');
			expect(mod.autoTooltipInit).toBeTypeOf('function');
		});
	});

	describe('autoTooltip', () => {
		it('loads module', async () => {
			const mod = await import('$lib/components/autotooltip/autoTooltip.svelte');
			expect(mod.default).toBeTruthy();
		});
	});
});
