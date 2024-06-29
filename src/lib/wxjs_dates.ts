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

Date.prototype.wxGetPeriodBegin = function (interval, units) {
	const dt = new Date(this.getTime());
	// without break statements!;
	/* eslint-disable  no-fallthrough */
	switch (String(interval).toLowerCase()) {
		case 'year':
		case 'years':
			dt.setMonth(1);
		case 'month':
		case 'months':
			dt.setDay(1);
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

Date.prototype.wxEquals = function (d) {
	return d ? this.getTime() === d.getTime() : false;
};

Date.prototype.wxClone = function () {
	return new Date(this.getTime());
};

const wxdates = {
	roundTimeTo15min: function (dt) {
		dt.setMilliseconds(0);
		dt.setSeconds(0);
		dt.setMinutes(Math.round(dt.getMinutes() / 15) * 15);
		return dt;
	},

	friendlyDateTime: function (dt) {
    if (typeof dt == 'string') {
      return dt.replace('T', ' ').substring(0, 19);
    }
		dt.setMilliseconds(0);
		return dt.toISOString().replace('T', ' ');
	},

	durationToFriendlyText: function (durationInSeconds, precise = true) {
		let text = '';
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
			if (durationInSeconds === null) text = 'nieznany';
			else if (durationInSeconds < 60) text = 'poniżej minuty';
			else if (durationInSeconds < 60 * 60)
				text = `ponad ${Math.floor(durationInSeconds / 60)} minut`;
			else if (durationInSeconds < 60 * 60 * 24)
				text = `ponad ${Math.floor(durationInSeconds / 60 / 60)} godzin`;
			else {
				const d = 60 * 60 * 24;
				const h = Math.floor((durationInSeconds % d) / 60 / 60);
				text = `ponad ${Math.floor(durationInSeconds / d)} dni${h > 0 ? ` i ${h} godzin` : ''}`;
			}
		}

		return text;
	},

	jsonDateToFriendlyText: function (jsonDate) {
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

	dateAdd: function (date: Date, interval: string, units: number) {
		if (!(date instanceof Date)) return undefined;
		let ret = new Date(date); //don't change original date
		const checkRollover = function () {
			if (ret.getDate() != date.getDate()) ret.setDate(0);
		};
		switch (String(interval).toLowerCase()) {
			case 'year':
			case 'years':
				ret.setFullYear(ret.getFullYear() + units);
				checkRollover();
				break;
			case 'quarter':
			case 'quarters':
				ret.setMonth(ret.getMonth() + 3 * units);
				checkRollover();
				break;
			case 'month':
			case 'months':
				ret.setMonth(ret.getMonth() + units);
				checkRollover();
				break;
			case 'week':
			case 'weeks':
				ret.setDate(ret.getDate() + 7 * units);
				break;
			case 'day':
			case 'days':
				ret.setDate(ret.getDate() + units);
				break;
			case 'hour':
			case 'hours':
				ret.setTime(ret.getTime() + units * 3600000);
				break;
			case 'minute':
			case 'minutes':
				ret.setTime(ret.getTime() + units * 60000);
				break;
			case 'second':
			case 'seconds':
				ret.setTime(ret.getTime() + units * 1000);
				break;
			default:
				ret = undefined;
				break;
		}
		return ret;
	},

	dateAddMinutes: function (date, units) {
		const ret = new Date(date);
		ret.setTime(ret.getTime() + units * 60000);
		return ret;
	},

	msecondsBetween: function (d1, d2, absolute = true) {
		const diff = d1.getTime() - d2.getTime();
		return absolute ? Math.abs(diff) : diff;
	},

	secondsBetween: function (d1, d2, absolute = true) {
		return this.msecondsBetween(d1, d2, absolute) / 1000;
	},

	minutesBetween: function (d1, d2, absolute = true) {
		return this.msecondsBetween(d1, d2, absolute) / 60000;
	},

	hoursBetween: function (d1, d2, absolute = true) {
		return (this.msecondsBetween(d1, d2, absolute) / 60) * 60000;
	},

	daysBetween: function (d1, d2, absolute = true) {
		return (this.msecondsBetween(d1, d2, absolute) / 24) * 60 * 60000;
	},

	datesDiffer: function (d1, d2) {
		return d1.getTime() !== d2.getTime();
	},

	datesDifference: function (d1, d2) {
		return new Date(d2.getTime() - d1.getTime());
	},

	datesDifferenceFromNow: function (d) {
		return new Date(new Date().getTime() - d.getTime());
	},

	friendlyDurationTill: function (d0, d1) {
		return this.durationToFriendlyText(this.secondsBetween(d1, d0, true), true);
	},
	
	friendlyDurationTillNow: function (d) {
		return this.friendlyDurationTill(d, new Date());
	},
	
};

export default wxdates;
