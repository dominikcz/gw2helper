<script>
	import EventsList from "./eventsList.svelte";

	export let events;
	export let category = '';
</script>

<details open>
	<summary>{category}</summary>
    <EventsList {events} on:toggle-watched />
</details>

