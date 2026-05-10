import { describe, expect, it, vi } from 'vitest';

vi.mock('idb-keyval', () => ({
	get: vi.fn(async () => undefined),
	set: vi.fn(async () => undefined),
	del: vi.fn(async () => undefined),
}));

const matchMediaMock = vi.fn(() => ({
	matches: false,
	addEventListener: vi.fn(),
	removeEventListener: vi.fn(),
}));

Object.defineProperty(globalThis, 'window', {
	value: {
		matchMedia: matchMediaMock,
		location: { search: '' },
		addEventListener: vi.fn(),
		removeEventListener: vi.fn(),
		dispatchEvent: vi.fn(),
	},
	configurable: true,
});

const componentModules = import.meta.glob('/src/lib/components/**/*.svelte');
const componentPaths = Object.keys(componentModules).sort();

const testFileModules = import.meta.glob('/src/**/*.{test,spec}.{ts,js}', {
	eager: true,
	query: '?raw',
	import: 'default'
}) as Record<string, string>;

const componentImportRegex = /import\s+[^;]*?from\s+['"](?:\$lib\/components\/|\/src\/lib\/components\/)([^'"]+\.svelte)['"]/g;

function getCoveredComponentPaths(): Set<string> {
	const covered = new Set<string>();

	for (const [testPath, source] of Object.entries(testFileModules)) {
		if (testPath.endsWith('/src/lib/components/all-components.test.ts')) {
			continue;
		}

		for (const match of source.matchAll(componentImportRegex)) {
			covered.add(`/src/lib/components/${match[1]}`);
		}
	}

	return covered;
}

describe('All lib/components are test-covered', () => {
	it('finds component files', () => {
		expect(componentPaths.length).toBeGreaterThan(0);
	});

	it('each component has an explicit test import', () => {
		const coveredComponents = getCoveredComponentPaths();
		const missingComponents = componentPaths.filter((path) => !coveredComponents.has(path));

		expect(
			missingComponents,
			`Missing explicit tests for components:\n${missingComponents.join('\n')}`
		).toEqual([]);
	});
});
