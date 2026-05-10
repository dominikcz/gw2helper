// @ts-nocheck
import { readable } from 'svelte/store'

export default function (options = {}) {
    let timerId;

    return readable(null, set => {
        const getNextTick = (dt, interval) => {
            let msecLeft;
            if (interval <= 1000) {
                msecLeft = 1000 - dt.getMilliseconds();
            } else {
                const elapsed = dt.getSeconds() * 1000 + dt.getMilliseconds();
                msecLeft = (1 + Math.floor(elapsed / interval)) * interval - elapsed;
            }
            const nextTick = Math.min(interval, msecLeft);
            return nextTick;
        }

        const updateTime = () => {
            // we want the clock to update its value every `options.interval` milliseconds, 
            // but we also want it to stay synchronized with 0 msec (as close as possible at least)
            // it won't be the case for interval not beeing a multiple of 1000
            let interval = options.interval || 1000;
            if (interval > 60000) {
                interval = 60000;
            }
            if (interval < 100) {
                interval = 100; // just a safeguard
            }
            const dt = new Date();
            timerId = setTimeout(() => updateTime(), getNextTick(dt, interval));
            set(dt);
        }

        updateTime(true)

        return () => clearTimeout(timerId)
    })
}
