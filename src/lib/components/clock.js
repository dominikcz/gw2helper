import { readable } from 'svelte/store'

export default function (options = {}) {
    return readable(null, set => {
        const update = () => set(new Date())

        update()

        const interval = setInterval(update, options.interval || 1000)

        return () => clearInterval(interval)
    })
}
