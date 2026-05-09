<script lang="ts">
	import { getContext } from 'svelte';
	import { TABS } from './tabs.svelte';
	/** @type {{children?: import('svelte').Snippet}} */
	let { children } = $props();

	const tab = {};
	const { registerTab, selectTab, selectedTab } = getContext(TABS);

	registerTab(tab);
</script>

<button class="tab {$selectedTab === tab ? 'selected' : '' }" onclick={() => selectTab(tab)}>
	{@render children?.()}
</button>