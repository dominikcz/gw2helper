<script>
	import EventsList from './eventsList.svelte';

	export let events;
	export let category = '';
	export let showChatLinks = false;
</script>

<details open>
	<summary>{category}</summary>
	<EventsList {events} {showChatLinks} on:toggle-watched />
</details>

<style lang="scss">
</style>
