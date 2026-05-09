<script lang="ts">
	import { grungeBorder } from '$lib/actions/grungeBorder';
	import EventsList from './eventsList.svelte';

	/** @type {{events: any, category?: string, showChatLinks?: boolean, onToggleWatched?: CallableFunction}} */
	let { events, category = '', showChatLinks = false, onToggleWatched = () => {} } = $props();
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
