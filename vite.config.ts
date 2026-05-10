import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import pkg from './package.json' with { type: 'json' };
import ViteYaml from '@modyfi/vite-plugin-yaml';
import { searchForWorkspaceRoot } from 'vite';

export default defineConfig({
	build: {
		target: 'esnext'
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
