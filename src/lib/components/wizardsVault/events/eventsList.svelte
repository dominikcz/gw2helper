<script>
	import EventItem from './eventItem.svelte';

	export let events;
</script>

<div class="events-list">
	{#each events as event}
		<EventItem name={event.name} heading={event.heading} category={event.category} watched={event.watched} on:toggle-watched/>
	{/each}
</div>
