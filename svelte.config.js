import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

const isVitest = process.env.VITEST === 'true';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://kit.svelte.dev/docs/integrations#preprocessors
	// for more information about preprocessors
	preprocess: vitePreprocess({ script: true }),

	kit: {
		adapter: adapter({
			fallback: '404.html',
			pages: "build"
		}),
		// prerender: {
		// 	entries: ['*'],
		// },
		paths: {
			base: isVitest ? '' : '/gw2helper'
		},
	}
};

export default config;
