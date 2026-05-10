import { describe, expect, it } from 'vitest';

describe('inventoryCleanupAdvice', () => {
	describe('inventoryCleanupAdvice', () => {
		it('loads module', async () => {
			const mod = await import('$lib/components/inventoryCleanupAdvice/inventoryCleanupAdvice.svelte');
			expect(mod.default).toBeTruthy();
		});
	});
});
