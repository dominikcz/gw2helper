import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import Tabs from '$lib/components/tabs/tabs.svelte';

describe('tabs', () => {
	describe('tabs', () => {
		it('renders tabs wrapper', () => {
			const { container } = render(Tabs);
			expect(container.querySelector('.tabs')).toBeInTheDocument();
		});
	});

	describe('tab', () => {
		it('loads module', async () => {
			const mod = await import('$lib/components/tabs/tab.svelte');
			expect(mod.default).toBeTruthy();
		});
	});

	describe('tabsPanel', () => {
		it('loads module', async () => {
			const mod = await import('$lib/components/tabs/tabsPanel.svelte');
			expect(mod.default).toBeTruthy();
		});
	});

	describe('tabs re-export', () => {
		it('exports all tab components', async () => {
			const mod = await import('$lib/components/tabs/tabs');
			expect(mod.Tabs).toBeTruthy();
			expect(mod.Tab).toBeTruthy();
			expect(mod.TabPanel).toBeTruthy();
		});
	});
});
