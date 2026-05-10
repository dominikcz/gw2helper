<script lang="ts">
	import EventItem from './eventItem.svelte';
	import { t as _ } from '$lib/services/i18n.js';
	type EventItemModel = {
		name: string;
		watched?: boolean;
		link?: string;
		chatlink?: string;
		next?: string;
		bg?: unknown;
		startTimes?: string[];
		alarms?: string[];
	};

	interface Props {
		events: EventItemModel[];
		showChatLinks?: boolean;
		onToggleWatched?: (payload: { name: string; watched: boolean }) => void;
		onAlarmsChange?: (payload: { name: string; alarms: string[] }) => void;
		children?: import('svelte').Snippet;
	}

	let { events, showChatLinks = false, onToggleWatched = () => {}, onAlarmsChange = () => {}, children = undefined }: Props = $props();
</script>

<div class="events-list">
	{#each events as event (event.name)}
		<EventItem {event} {showChatLinks} {onToggleWatched} {onAlarmsChange} />
	{:else}
		<span class="no-results">
			{#if children}{@render children()}{:else}{$_('common.nothing_found')}{/if}
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
