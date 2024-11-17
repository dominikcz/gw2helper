<script>
	import { grungeBorder } from '$lib/actions/grungeBorder';
	import EventsList from './eventsList.svelte';

	export let events;
	export let category = '';
	export let showChatLinks = false;
</script>

<details open use:grungeBorder>
	<summary>{category}</summary>
	<EventsList {events} {showChatLinks} on:toggle-watched />
</details>

<style lang="scss">
	:global(details .events-list) {
		margin: 0.6em;
	}
</style>
