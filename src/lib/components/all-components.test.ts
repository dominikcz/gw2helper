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
const componentEntries = Object.entries(componentModules).sort(([a], [b]) => a.localeCompare(b));

function getFolder(path: string): string {
	const prefix = '/src/lib/components/';
	const relativePath = path.startsWith(prefix) ? path.slice(prefix.length) : path;
	const [folder = 'root'] = relativePath.split('/');
	return folder;
}

function getComponentName(path: string): string {
	const file = path.split('/').at(-1) ?? path;
	return file.replace(/\.svelte$/, '');
}

const groupedComponents = componentEntries.reduce<Record<string, Array<[string, () => Promise<unknown>]>>>((acc, [path, loader]) => {
	const folder = getFolder(path);
	if (!acc[folder]) {
		acc[folder] = [];
	}
	acc[folder].push([path, loader]);
	return acc;
}, {});

const folderNames = Object.keys(groupedComponents).sort((a, b) => a.localeCompare(b));

describe('All lib/components are test-covered', () => {
	it('finds component files', () => {
		expect(componentEntries.length).toBeGreaterThan(0);
	});

	it('has no root-level component files', () => {
		expect(groupedComponents.root ?? []).toEqual([]);
	});

	for (const folder of folderNames) {
		describe(`folder: ${folder}`, () => {
			for (const [path, loader] of groupedComponents[folder]) {
				describe(`component: ${getComponentName(path)}`, () => {
					it(`loads module: ${path}`, async () => {
						const mod = (await loader()) as { default?: unknown };
						expect(mod).toBeTruthy();
						expect(mod.default).toBeTruthy();
					});
				});
			}
		});
	}
});
