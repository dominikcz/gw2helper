import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import { playwright } from '@vitest/browser-playwright';
import pkg from './package.json' with { type: 'json' };
import ViteYaml from '@modyfi/vite-plugin-yaml';
import { searchForWorkspaceRoot } from 'vite';

export default defineConfig({
	build: {
		target: 'esnext',
	},
	plugins: [sveltekit(), ViteYaml()],
	test: {
		expect: { requireAssertions: true },
		projects: [
			{
				extends: './vite.config.ts',
				test: {
					name: 'client',
					browser: {
						enabled: true,
						provider: playwright(),
						instances: [{ browser: 'chromium', headless: true }],
					},
					include: ['src/lib/components/**/*.{test,spec}.{js,ts}'],
					setupFiles: ['src/test/setup-i18n.ts', 'src/test/setup-testing-library.ts'],
					exclude: ['src/lib/server/**'],
				},
			},
			{
				extends: './vite.config.ts',
				test: {
					name: 'server',
					environment: 'node',
					include: ['src/**/*.{test,spec}.{js,ts}'],
					exclude: ['src/lib/components/**/*.{test,spec}.{js,ts}'],
					setupFiles: ['src/test/setup-i18n.ts'],
				},
			},
		],
	},
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
