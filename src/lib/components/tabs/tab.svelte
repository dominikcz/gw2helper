<script lang="ts">
	import { getContext } from 'svelte';
	import { TABS } from './tabs.svelte';
	import type { TabsContext } from './tabs.svelte';
	/** @type {{children?: import('svelte').Snippet}} */
	let { children = undefined } = $props();

	const tab: Record<string, unknown> = {};
	const { registerTab, selectTab, selectedTab } = getContext<TabsContext>(TABS);

	registerTab(tab);
</script>

<button class="tab {$selectedTab === tab ? 'selected' : '' }" onclick={() => selectTab(tab)}>
	{@render children?.()}
</button>