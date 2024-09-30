<script>
	import EventsList from './eventsList.svelte';

	export let events;
	export let category = '';
	export let showChatLinks = false;
</script>

<details open class="masked" style="mask-position: {Math.trunc(Math.random() * 1000)}px bottom;">
	<summary>{category}</summary>
	<EventsList {events} {showChatLinks} on:toggle-watched />
</details>

<style lang="scss">
	:global(details .events-list) {
		margin: 0.6em;
	}
</style>
