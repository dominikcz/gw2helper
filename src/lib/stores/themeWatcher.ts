import { readable } from 'svelte/store';

export default function () {
    return readable<boolean>(null, set => {
        let darkMode = false;
        if (window.matchMedia) {
            if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                darkMode = true;
            }
            window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', hndColorPrefChange);
        }

        console.log('darkMode', darkMode);
        set(darkMode);

        function hndColorPrefChange(event) {
            console.log('darkMode', event.matches);
            set(event.matches);
        }

        return () => {
            // console.log('themeWatcher destroy')
            if (window.matchMedia) {
                window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', hndColorPrefChange);
            }
        }
    })
}
