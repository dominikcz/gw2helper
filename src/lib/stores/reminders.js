import { writable } from 'svelte/store';

export const remindersSettings = writable({
    inAdvance: 5,
    sound: 'trumpet'
})
