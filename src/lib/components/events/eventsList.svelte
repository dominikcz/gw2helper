<script>
	import { base } from '$app/paths';
	import EventItem from './eventItem.svelte';

	export let events;
	export let showChatLinks = false;
</script>

<div class="events-list">
	{#each events as event}
		<EventItem {event} {showChatLinks} on:toggle-watched />
	{:else}
		<span class="no-results">
			You have not added anything to the list yet. Add items by clicking
			<img src="{base}/assets/rewards/map_heart_empty.png" alt="not on list" class="icon-small" />
			icon on any of the events below.
		</span>
	{/each}
</div>

<style lang="scss">
	.events-list {
		padding: 0.5em 1em;
		display: flex;
		flex-flow: column nowrap;
		gap: 1em;
	}



	@media (min-width: 900px) {
		.events-list {
			flex-flow: row wrap;
		}
	}

</style>
