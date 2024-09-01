import { readable } from 'svelte/store';

let darkMode = false;

if (window.matchMedia) {
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
        darkMode = true;
    }
}

export default function () {
    return readable<boolean>(darkMode, set => {
        window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', hndColorPrefChange);

        function hndColorPrefChange(event) {
            console.log('darkMode', event.matches);
            set(event.matches);
        }

        return () => {
            // console.log('themeWatcher destroy')
            window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', hndColorPrefChange);
        }
    })
}
