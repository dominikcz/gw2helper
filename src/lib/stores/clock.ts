import { readable, type Readable } from 'svelte/store';

type ClockStoreOptions = {
	interval?: number;
};

function getNextTick(dt: Date, interval: number): number {
	if (interval <= 1000) {
		return 1000 - dt.getMilliseconds();
	}

	const elapsed = dt.getSeconds() * 1000 + dt.getMilliseconds();
	const msecLeft = (1 + Math.floor(elapsed / interval)) * interval - elapsed;
	return Math.min(interval, msecLeft);
}

export default function createClockStore(options: ClockStoreOptions = {}): Readable<Date | null> {
	let timerId: ReturnType<typeof setTimeout> | undefined;

	return readable<Date | null>(null, (set) => {
		const updateTime = () => {
			// Keep updates aligned with second boundaries for stable clock UI.
			let interval = options.interval ?? 1000;
			if (interval > 60000) {
				interval = 60000;
			}
			if (interval < 100) {
				interval = 100;
			}

			const dt = new Date();
			timerId = setTimeout(updateTime, getNextTick(dt, interval));
			set(dt);
		};

		updateTime();

		return () => {
			if (timerId) {
				clearTimeout(timerId);
			}
		};
	});
}
