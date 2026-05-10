import { describe, expect, it } from 'vitest';

describe('trading-post', () => {
	describe('deliveryBox', () => {
		it('loads module', async () => {
			const mod = await import('$lib/components/trading-post/deliveryBox.svelte');
			expect(mod.default).toBeTruthy();
		});
	});

	describe('transactionList', () => {
		it('loads module', async () => {
			const mod = await import('$lib/components/trading-post/transactionList.svelte');
			expect(mod.default).toBeTruthy();
		});
	});
});
