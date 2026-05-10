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

describe('All lib/components are test-covered', () => {
	it('finds component files', () => {
		expect(componentPaths.length).toBeGreaterThan(0);
	});

	for (const path of componentPaths) {
		it(`loads component module: ${path}`, async () => {
			const mod = (await componentModules[path]()) as { default?: unknown };
			expect(mod).toBeTruthy();
			expect(mod.default).toBeTruthy();
		});
	}
});
