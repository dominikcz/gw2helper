<script>
	import EventItem from './eventItem.svelte';
	import { t as _ } from '$lib/services/i18n.js';

	export let events;
	export let showChatLinks = false;
</script>

<div class="events-list">
	{#each events as event (event.name)}
		<EventItem {event} {showChatLinks} on:toggle-watched on:alarms-change />
	{:else}
		<span class="no-results">
			<slot>{$_('common.nothing_found')}</slot>
		</span>
	{/each}
</div>

<style lang="scss">
	.events-list {
		// padding: 0.5em 1em;
		display: flex;
		flex-flow: column nowrap;
		gap: 1em;
		align-items: stretch;
	}

	@media (min-width: 40em) {
		.events-list {
			flex-flow: row wrap;
		}
	}

</style>
