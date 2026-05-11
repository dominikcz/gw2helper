import { describe, expect, it, vi } from 'vitest';
import eventsUtils from '$lib/components/events/eventsUtils';

vi.mock('$lib/stores/themeWatcher', () => ({
	default: () => {
		const { readable } = require('svelte/store');
		return readable(false);
	},
}));

describe('events', () => {
	describe('eventsUtils', () => {
		describe('getColor', () => {
			it('returns rgb string from number array', () => {
				expect(eventsUtils.getColor([100, 150, 200], false)).toBe('rgb(100,150,200)');
			});

			it('returns raw string when given a string color', () => {
				expect(eventsUtils.getColor('#ff0000', false)).toBe('#ff0000');
			});

			it('returns default black for undefined colors', () => {
				expect(eventsUtils.getColor(undefined, false)).toBe('rgb(0,0,0)');
			});

			it('returns gradient for nested arrays', () => {
				const result = eventsUtils.getColor([[100, 150, 200], [50, 75, 100]], false);
				expect(result).toContain('linear-gradient');
				expect(result).toContain('rgb(100,150,200)');
				expect(result).toContain('rgb(50,75,100)');
			});

			it('darkens colors when darkMode is true', () => {
				const light = eventsUtils.getColor([200, 200, 200], false);
				const dark = eventsUtils.getColor([200, 200, 200], true);
				expect(dark).not.toBe(light);
			});
		});

		describe('getHour', () => {
			it('returns HH:MM formatted string', () => {
				const date = new Date('2024-01-15T14:30:00');
				expect(eventsUtils.getHour(date)).toBe('14:30');
			});

			it('pads single-digit hours', () => {
				const date = new Date('2024-01-15T09:05:00');
				expect(eventsUtils.getHour(date)).toBe('09:05');
			});
		});
	});

	describe('eventTimerTime', () => {
		it('loads module', async () => {
			const mod = await import('$lib/components/events/eventTimerTime.svelte');
			expect(mod.default).toBeTruthy();
		});
	});

	describe('eventItem', () => {
		it('loads module', async () => {
			const mod = await import('$lib/components/events/eventItem.svelte');
			expect(mod.default).toBeTruthy();
		});
	});

	describe('eventsList', () => {
		it('loads module', async () => {
			const mod = await import('$lib/components/events/eventsList.svelte');
			expect(mod.default).toBeTruthy();
		});
	});

	describe('eventsCategory', () => {
		it('loads module', async () => {
			const mod = await import('$lib/components/events/eventsCategory.svelte');
			expect(mod.default).toBeTruthy();
		});
	});

	describe('eventTimerItem', () => {
		it('loads module', async () => {
			const mod = await import('$lib/components/events/eventTimerItem.svelte');
			expect(mod.default).toBeTruthy();
		});
	});

	describe('eventTimers', () => {
		it('loads module', async () => {
			const mod = await import('$lib/components/events/eventTimers.svelte');
			expect(mod.default).toBeTruthy();
		});
	});

	describe('eventReminders', () => {
		it('loads module', async () => {
			const mod = await import('$lib/components/events/eventReminders.svelte');
			expect(mod.default).toBeTruthy();
		});
	});
});
