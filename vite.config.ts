import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import pkg from './package.json' assert { type: 'json' };
import ViteYaml from '@modyfi/vite-plugin-yaml';

export default defineConfig({
	build: {
		target: 'esnext'
	},
	plugins: [sveltekit(), ViteYaml()],
	test: {
		include: ['src/**/*.{test,spec}.{js,ts}']
	},
	// assetsInclude: ['**/*.yaml', '**/*.json'],
	define: {
		__NAME__: `"${pkg.name}"`,
		__VERSION__: `"${pkg.version}"`
	}
});
