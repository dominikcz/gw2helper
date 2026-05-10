import { describe, expect, it } from 'vitest';
import { get } from 'svelte/store';
import { alert } from '$lib/components/alert/alert';

describe('alert', () => {
	describe('alert store', () => {
		it('initializes with empty string', () => {
			expect(get(alert)).toBe('');
		});

		it('can be set with a message', () => {
			alert.set('Test alert message');
			expect(get(alert)).toBe('Test alert message');
			alert.set('');
		});

		it('can be cleared', () => {
			alert.set('Some alert');
			alert.set('');
			expect(get(alert)).toBe('');
		});
	});
});
