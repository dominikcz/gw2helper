Date.prototype.wxUseTimeOffset = true;
Date.prototype.wxToLocaleISOString = function () {
	if (this.wxUseTimeOffset) {
		const tzoffset = this.getTimezoneOffset() * 60000;
		return new Date(this.getTime() - tzoffset).toISOString(); //.slice(0, -1);
	} else {
		return this.toISOString(); //.slice(0, -1);
	}
};

Date.prototype.wxToLocaleISOStringClean = function () {
	return this.wxToLocaleISOString().slice(0, -5).replace('T', ' ');
};

Date.prototype.wxToLocaleTimeString = function () {
	if (this.wxUseTimeOffset) {
		const tzoffset = this.getTimezoneOffset() * 60000;
		return new Date(this.getTime() - tzoffset).toLocaleTimeString(); //.slice(0, -1);
	} else {
		return this.toLocaleTimeString(); //.slice(0, -1);
	}
};

Date.prototype.wxToFriendlyText = function () {
	const today = new Date().wxToLocaleISOStringClean();
	const s = this.wxToLocaleISOStringClean();

	if (today.slice(0, 10) == s.slice(0, 10)) {
		return s.slice(11, 19);
	} else {
		return s;
	}
};

type OptionalTimePart = number | null | undefined;

function setTime(dt: Date, utc?: boolean, atHour?: OptionalTimePart, atMinute?: OptionalTimePart, atSecond?: OptionalTimePart): Date {
	if (utc) {
		if (atHour != null) {
			dt.setUTCHours(atHour)
		}
		if (atMinute != null) {
			dt.setUTCMinutes(atMinute)
		}
		if (atSecond != null) {
			dt.setUTCSeconds(atSecond)
		}
	} else {
		if (atHour != null) {
			dt.setHours(atHour)
		}
		if (atMinute != null) {
			dt.setMinutes(atMinute)
		}
		if (atSecond != null) {
			dt.setSeconds(atSecond)
		}
	}
	dt.setMilliseconds(0);
	return dt;
}

function setDate(daysAdd: number, utc?: boolean, atHour?: OptionalTimePart, atMinute?: OptionalTimePart, atSecond?: OptionalTimePart): Date {
	let newDate = new Date();
	newDate.setDate(newDate.getDate() + daysAdd);
	return setTime(newDate, utc, atHour, atMinute, atSecond);
}

Date.prototype.wxTomorrow = function (utc?: boolean, atHour?: OptionalTimePart, atMinute?: OptionalTimePart, atSecond?: OptionalTimePart) {
	return setDate(1, utc, atHour, atMinute, atSecond);
}

Date.prototype.wxYesterday = function (utc?: boolean, atHour?: OptionalTimePart, atMinute?: OptionalTimePart, atSecond?: OptionalTimePart) {
	return setDate(-1, utc, atHour, atMinute, atSecond);
}

Date.prototype.wxToday = function (utc?: boolean, atHour?: OptionalTimePart, atMinute?: OptionalTimePart, atSecond?: OptionalTimePart) {
	return setDate(0, utc, atHour, atMinute, atSecond);
}

Date.prototype.wxNextWeekDay = function (weekDay = 1, utc?: boolean, atHour?: OptionalTimePart, atMinute?: OptionalTimePart, atSecond?: OptionalTimePart) {
	const d = new Date();
	const currentWeekDay = d.getDay();
	const currentTime = d.getHours() * 60 * 60 + d.getMinutes() * 60 + d.getSeconds();
	const targetTime = (atHour || 0) * 60 * 60 + (atMinute || 0) * 60 + (atSecond || 0);

	let numOfDays = ((7 - d.getDay()) % 7 + weekDay) % 7;
	if ((currentWeekDay == weekDay) && (currentTime > targetTime)) {
		numOfDays += 7;
	}
	d.setDate(d.getDate() + numOfDays);

	return setTime(d, utc, atHour, atMinute, atSecond);
}

Date.prototype.wxNextQuarterOfYear = function (utc?: boolean, atHour?: OptionalTimePart, atMinute?: OptionalTimePart, atSecond?: OptionalTimePart) {
	const today = new Date();
	const quarter = Math.floor((today.getMonth() + 3) / 3);
	const nextq = (quarter == 4) ? new Date(today.getFullYear() + 1, 1, 1) : new Date(today.getFullYear(), quarter * 3, 1);
	return setTime(nextq, utc, atHour, atMinute, atSecond);
}

Date.prototype.wxGetPeriodBegin = function (interval: string, units: number) {
	const dt = new Date(this.getTime());
	// without break statements!;
	/* eslint-disable  no-fallthrough */
	switch (String(interval).toLowerCase()) {
		case 'year':
		case 'years':
			dt.setMonth(1);
		case 'month':
		case 'months':
			dt.setDate(1);
		case 'day':
		case 'days':
			dt.setHours(0);
		case 'hour':
		case 'hours':
			dt.setMinutes(0);
		case 'minute':
		case 'minutes':
			dt.setSeconds(0);
		default:
			dt.setMilliseconds(0);
			break;
	}
	// TODO
	// dt.setMinutes(Math.floor(dt.getMinutes() / 15) * 15);
	return dt;
};

Date.prototype.wxGetPeriodEnd = function (interval, units) {
	const dt = new Date(this.getTime());
	return dt;
};
Date.prototype.wxGetQuarterBegin = function () {
	const dt = new Date(this.getTime());
	dt.setMilliseconds(0);
	dt.setSeconds(0);
	dt.setMinutes(Math.floor(dt.getMinutes() / 15) * 15);
	return dt;
};

Date.prototype.wxGetQuarterEnd = function () {
	const dt = new Date(this.getTime());
	dt.setMilliseconds(0);
	dt.setSeconds(0);
	dt.setMinutes(15 + Math.floor(dt.getMinutes() / 15) * 15);
	return dt;
};

Date.prototype.wxGetNextQuarter = function () {
	const dt = new Date(this.getTime());
	dt.setMilliseconds(0);
	dt.setSeconds(0);
	dt.setMinutes(Math.trunc((dt.getMinutes() + 15) / 15) * 15);
	return dt;
};

Date.prototype.wxEquals = function (d?: Date) {
	return d ? this.getTime() === d.getTime() : false;
};

Date.prototype.wxClone = function () {
	return new Date(this.getTime());
};

const wxdates = {
	roundTimeTo15min: function (dt: Date) {
		dt.setMilliseconds(0);
		dt.setSeconds(0);
		dt.setMinutes(Math.round(dt.getMinutes() / 15) * 15);
		return dt;
	},

	friendlyDateTime: function (dt: string | Date) {
		if (typeof dt == 'string') {
			return dt.replace('T', ' ').substring(0, 19);
		}
		dt.setMilliseconds(0);
		return dt.toISOString().replace('T', ' ');
	},

	durationToFriendlyText: function (durationInSeconds: number | null, precise = true) {
		let text = '';
		if (durationInSeconds === null) {
			return '?';
		}
		if (precise) {
			const days = Math.floor(durationInSeconds / (60 * 60 * 24));

			durationInSeconds -= days * (60 * 60 * 24);

			const hours = Math.floor(durationInSeconds / (60 * 60));
			durationInSeconds -= hours * (60 * 60);

			const mins = Math.floor(durationInSeconds / 60);
			durationInSeconds -= mins * 60;

			const seconds = Math.floor(durationInSeconds);
			durationInSeconds -= seconds;

			text =
				mins + hours + days > 0 ? seconds.toString().padStart(2, '0') : seconds.toString() + 's';
			if (mins > 0 || hours > 0 || days > 0) text = mins.toString().padStart(2, '0') + ':' + text;
			if (hours > 0 || days > 0) text = hours.toString().padStart(2, '0') + ':' + text;
			if (days > 0) text = `${days}d ` + text;
		} else {
			// TODO: dodać pluralizację
			if (durationInSeconds === null) text = '?';
			else if (durationInSeconds < 60) text = '< 1m';
			else if (durationInSeconds < 60 * 60)
				text = `${Math.floor(durationInSeconds / 60)}m`;
			else if (durationInSeconds < 60 * 60 * 24)
				text = `${Math.floor(durationInSeconds / 60 / 60)}h`;
			else {
				const d = 60 * 60 * 24;
				const h = Math.floor((durationInSeconds % d) / 60 / 60);
				text = `${Math.floor(durationInSeconds / d)}d ${h > 0 ? ` ${h}h` : ''}`;
			}
		}

		return text;
	},

	jsonDateToFriendlyText: function (jsonDate: string) {
		const dt = new Date(jsonDate);
		const dtUTC = new Date(
			Date.UTC(
				dt.getFullYear(),
				dt.getMonth(),
				dt.getDay(),
				dt.getHours(),
				dt.getMinutes(),
				dt.getSeconds()
			)
		);
		return dtUTC.wxToFriendlyText();
	},

	dateAdd: function (date: Date, interval: string, units: number): Date | undefined {
		if (!(date instanceof Date)) return undefined;
		let ret: Date | undefined = new Date(date); //don't change original date
		const checkRollover = function () {
			if (ret && ret.getDate() != date.getDate()) ret.setDate(0);
		};
		switch (String(interval).toLowerCase()) {
			case 'year':
			case 'years':
				ret!.setFullYear(ret!.getFullYear() + units);
				checkRollover();
				break;
			case 'quarter':
			case 'quarters':
				ret!.setMonth(ret!.getMonth() + 3 * units);
				checkRollover();
				break;
			case 'month':
			case 'months':
				ret!.setMonth(ret!.getMonth() + units);
				checkRollover();
				break;
			case 'week':
			case 'weeks':
				ret!.setDate(ret!.getDate() + 7 * units);
				break;
			case 'day':
			case 'days':
				ret!.setDate(ret!.getDate() + units);
				break;
			case 'hour':
			case 'hours':
				ret!.setTime(ret!.getTime() + units * 3600000);
				break;
			case 'minute':
			case 'minutes':
				ret!.setTime(ret!.getTime() + units * 60000);
				break;
			case 'second':
			case 'seconds':
				ret!.setTime(ret!.getTime() + units * 1000);
				break;
			default:
				ret = undefined;
				break;
		}
		return ret;
	},

	dateAddMinutes: function (date: Date, units: number) {
		const ret = new Date(date);
		ret.setTime(ret.getTime() + units * 60000);
		return ret;
	},

	msecondsBetween: function (d1: Date, d2: Date, absolute = true) {
		const diff = d1.getTime() - d2.getTime();
		return absolute ? Math.abs(diff) : diff;
	},

	secondsBetween: function (d1: Date, d2: Date, absolute = true) {
		return this.msecondsBetween(d1, d2, absolute) / 1000;
	},

	minutesBetween: function (d1: Date, d2: Date, absolute = true) {
		return this.msecondsBetween(d1, d2, absolute) / 60000;
	},

	hoursBetween: function (d1: Date, d2: Date, absolute = true) {
		return (this.msecondsBetween(d1, d2, absolute) / 60) * 60000;
	},

	daysBetween: function (d1: Date, d2: Date, absolute = true) {
		return (this.msecondsBetween(d1, d2, absolute) / 24) * 60 * 60000;
	},

	datesDiffer: function (d1: Date, d2: Date) {
		return d1.getTime() !== d2.getTime();
	},

	datesDifference: function (d1: Date, d2: Date) {
		return new Date(d2.getTime() - d1.getTime());
	},

	datesDifferenceFromNow: function (d: Date) {
		return new Date(new Date().getTime() - d.getTime());
	},

	friendlyDurationTill: function (d0: Date, d1: Date, precise = true) {
		return this.durationToFriendlyText(this.secondsBetween(d1, d0, true), precise);
	},

	friendlyDurationTillNow: function (d: Date, precise = true) {
		return this.friendlyDurationTill(d, new Date(), precise);
	},

	setTime,
};

export default wxdates;
