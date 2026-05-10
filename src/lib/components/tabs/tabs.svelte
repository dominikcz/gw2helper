<script lang="ts" module>
	export const TABS = {};

	export type TabRef = Record<string, unknown>;
	export interface TabsContext {
		registerTab: (tab: TabRef) => void;
		registerPanel: (panel: TabRef) => void;
		selectTab: (tab: TabRef) => void;
		selectedTab: import('svelte/store').Writable<TabRef | null>;
		selectedPanel: import('svelte/store').Writable<TabRef | null>;
	}
</script>

<script lang="ts">
	import { setContext, onDestroy } from 'svelte';
	import { writable } from 'svelte/store';
	/** @type {{children?: import('svelte').Snippet}} */
	let { children = undefined } = $props();

	type TabRef = Record<string, unknown>;
	const tabs: TabRef[] = [];
	const panels: TabRef[] = [];
	const selectedTab = writable<TabRef | null>(null);
	const selectedPanel = writable<TabRef | null>(null);

	setContext<import('./tabs.svelte').TabsContext>(TABS, {
		registerTab: (tab: TabRef) => {
			tabs.push(tab);
			selectedTab.update(current => current || tab);
			
			onDestroy(() => {
				const i = tabs.indexOf(tab);
				tabs.splice(i, 1);
				selectedTab.update(current => current === tab ? (tabs[i] || tabs[tabs.length - 1]) : current);
			});
		},

		registerPanel: (panel: TabRef) => {
			panels.push(panel);
			selectedPanel.update(current => current || panel);
			
			onDestroy(() => {
				const i = panels.indexOf(panel);
				panels.splice(i, 1);
				selectedPanel.update(current => current === panel ? (panels[i] || panels[panels.length - 1]) : current);
			});
		},

		selectTab: (tab: TabRef) => {
			const i = tabs.indexOf(tab);
			selectedTab.set(tab);
			selectedPanel.set(panels[i] ?? null);
		},

		selectedTab,
		selectedPanel
	});
</script>

<div class="tabs">
	{@render children?.()}
</div>