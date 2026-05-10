<script lang="ts">
	import { grungeBorder } from '$lib/actions/grungeBorder';
	import EventsList from './eventsList.svelte';
	type EventItem = {
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
		events: EventItem[];
		category?: string;
		showChatLinks?: boolean;
		onToggleWatched?: (payload: { name: string; watched: boolean }) => void;
	}

	let { events, category = '', showChatLinks = false, onToggleWatched = () => {} }: Props = $props();
</script>

<details open use:grungeBorder>
	<summary>{category}</summary>
	<EventsList {events} {showChatLinks} {onToggleWatched} />
</details>

<style lang="scss">
	:global(details .events-list) {
		margin: 0.6em;
	}
</style>
