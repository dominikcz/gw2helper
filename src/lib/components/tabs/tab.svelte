<script>
	import { getContext } from 'svelte';
	import { TABS } from './tabs.svelte';

	const tab = {};
	const { registerTab, selectTab, selectedTab } = getContext(TABS);

	registerTab(tab);
</script>

<button class="tab {$selectedTab === tab ? 'selected' : '' }" on:click="{() => selectTab(tab)}">
	<slot></slot>
</button>