import wxdates from '$lib/wxjs_dates';

export enum Period {
	daily = 'daily',
	weekly = 'weekly',
	special = 'special',
}

export function getTimerTarget(period: Period, seasonEnd?: string): Date {
	switch (period) {
		case Period.daily:
			return Date.prototype.wxTomorrow(true, 0, 0, 0);
		case Period.weekly:
			return Date.prototype.wxNextWeekDay(1, true, 7, 30, 0);
		case Period.special:
			return seasonEnd ? new Date(seasonEnd) : new Date();
	}
}

export function currentDay(dt: string): boolean {
	const currentDate = new Date(dt);
	const currDay = Date.prototype.wxToday(true, 0, 0, 0);
	return wxdates.secondsBetween(currentDate, currDay, false) >= 0;
}

export function currentWeek(dt: string): boolean {
	const currentDate = new Date(dt);
	const startOfWeek = wxdates.dateAdd(Date.prototype.wxNextWeekDay(1, true, 0, 0, 0), 'day', -7) || new Date(0);
	return wxdates.secondsBetween(currentDate, startOfWeek, false) >= 0;
}
