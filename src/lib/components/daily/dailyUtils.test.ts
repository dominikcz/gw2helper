import { describe, expect, it } from 'vitest';
import '$lib/wxjs_dates'; // load Date prototype extensions
import { Period, getTimerTarget, currentDay, currentWeek } from './dailyUtils';

describe('getTimerTarget', () => {
	it('returns a Date for daily', () => {
		const result = getTimerTarget(Period.daily);
		expect(result).toBeInstanceOf(Date);
	});

	it('returns a Date for weekly', () => {
		const result = getTimerTarget(Period.weekly);
		expect(result).toBeInstanceOf(Date);
	});

	it('daily target is in the future', () => {
		const result = getTimerTarget(Period.daily);
		expect(result.getTime()).toBeGreaterThan(Date.now());
	});

	it('weekly target is within the next 7 days', () => {
		const result = getTimerTarget(Period.weekly);
		const now = Date.now();
		expect(result.getTime()).toBeGreaterThanOrEqual(now - 24 * 60 * 60 * 1000); // at most 1 day in the past (timezone edge)
		expect(result.getTime()).toBeLessThanOrEqual(now + 8 * 24 * 60 * 60 * 1000); // at most 8 days ahead
	});

	it('special returns seasonEnd date when provided', () => {
		const end = '2099-12-31T00:00:00.000Z';
		const result = getTimerTarget(Period.special, end);
		expect(result.getTime()).toBe(new Date(end).getTime());
	});

	it('special returns current date when seasonEnd not provided', () => {
		const before = Date.now();
		const result = getTimerTarget(Period.special);
		const after = Date.now();
		expect(result.getTime()).toBeGreaterThanOrEqual(before);
		expect(result.getTime()).toBeLessThanOrEqual(after);
	});
});

describe('currentDay', () => {
	it('returns true when last_modified is now', () => {
		expect(currentDay(new Date().toISOString())).toBe(true);
	});

	it('returns true when last_modified is 1 hour ago (same UTC day typically)', () => {
		const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
		// only reliable if we haven't just passed midnight UTC — check against today start
		const todayUtcStart = new Date();
		todayUtcStart.setUTCHours(0, 0, 0, 0);
		const expected = oneHourAgo >= todayUtcStart;
		expect(currentDay(oneHourAgo.toISOString())).toBe(expected);
	});

	it('returns false when last_modified is yesterday', () => {
		const yesterday = new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString();
		expect(currentDay(yesterday)).toBe(false);
	});

	it('returns false when last_modified is one year ago', () => {
		const past = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
		expect(currentDay(past)).toBe(false);
	});
});

describe('currentWeek', () => {
	it('returns true when last_modified is now', () => {
		expect(currentWeek(new Date().toISOString())).toBe(true);
	});

	it('returns false when last_modified is 8 days ago', () => {
		const past = new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString();
		expect(currentWeek(past)).toBe(false);
	});

	it('returns false when last_modified is one year ago', () => {
		const past = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();
		expect(currentWeek(past)).toBe(false);
	});
});
