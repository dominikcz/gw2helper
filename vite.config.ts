import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';
import ViteYaml from '@modyfi/vite-plugin-yaml';
import pkg from './package.json' assert { type: 'json' };

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
