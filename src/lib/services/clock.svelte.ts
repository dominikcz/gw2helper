import { onDestroy } from 'svelte';
interface ClockOptions {
    interval?: number;
}

const DEFAULT_OPTIONS: ClockOptions = {
    interval: 1000,
}

export default class Clock {
    private timerId: number;
    private time = $state(new Date);
    private interval: number;

    constructor(options: ClockOptions = DEFAULT_OPTIONS) {
        // we want the clock to update its value every `options.interval` milliseconds, 
        // but we also want it to stay synchronized with 0 msec (as close as possible at least)
        // it won't be the case for interval not beeing a multiple of 1000
        this.interval = options.interval || 1000;
        if (this.interval > 60000) {
            this.interval = 60000;
        }
        if (this.interval < 10) {
            this.interval = 10; // just a safeguard
        }
        this.updateTime();
        onDestroy(() => clearInterval(this.timerId));
    }

    private updateTime() {
        const dt = new Date();
        this.timerId = setTimeout(() => this.updateTime(), this.getNextTick(dt));
        this.time = dt;
    }

    private getNextTick(dt: Date) {
        let msecLeft;
        if (this.interval <= 1000) {
            msecLeft = 1000 - dt.getMilliseconds();
        } else {
            const elapsed = dt.getSeconds() * 1000 + dt.getMilliseconds();
            msecLeft = (1 + Math.floor(elapsed / this.interval)) * this.interval - elapsed;
        }
        const nextTick = Math.min(this.interval, msecLeft);
        return nextTick;
    }

    get value() {
        return this.time
    }

    set value(value) {
        this.time = value
    }

}
