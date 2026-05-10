import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import pkg from './package.json' with { type: 'json' };
import ViteYaml from '@modyfi/vite-plugin-yaml';
import { searchForWorkspaceRoot } from 'vite';

export default defineConfig({
	build: {
		target: 'esnext',
		// rollupOptions: {
		// 	output: {
		// 		manualChunks: (id) => {
		// 			if (id.includes('node_modules/svelte') || id.includes('node_modules/@sveltejs')) {
		// 				return 'vendor-svelte';
		// 			}
		// 			if (id.includes('node_modules/sveltekit-i18n') || id.includes('node_modules/@sveltekit-i18n')) {
		// 				return 'vendor-i18n';
		// 			}
		// 			if (id.includes('node_modules/howler')) {
		// 				return 'vendor-audio';
		// 			}
		// 			if (id.includes('node_modules')) {
		// 				return 'vendor';
		// 			}
		// 		}
		// 	}
		// }
	},
	plugins: [sveltekit(), ViteYaml()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}'],
		setupFiles: ['src/test/setup-i18n.ts']
	},
	// assetsInclude: ['**/*.yaml', '**/*.json'],
	define: {
		__NAME__: `"${pkg.name}"`,
		__VERSION__: `"${pkg.version}"`
	},
	css: {
		preprocessorOptions: {}
	},
	server: {
		fs: {
			allow: [
				searchForWorkspaceRoot(process.cwd()),
				'/gw2helper_settings.json',
			],
		},
	},
});
