<script lang="ts">
	import { getContext } from 'svelte';
	import { TABS } from './tabs.svelte';
	import type { TabsContext } from './tabs.svelte';
	/** @type {{children?: import('svelte').Snippet}} */
	let { children = undefined } = $props();

	const panel: Record<string, unknown> = {};
	const { registerPanel, selectedPanel } = getContext<TabsContext>(TABS);

	registerPanel(panel);
</script>

{#if $selectedPanel === panel}
	{@render children?.()}
{/if}