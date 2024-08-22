<script>
	import { createEventDispatcher } from 'svelte';
	import { base } from '$app/paths';

	export let icon = '';
	export let name;
	export let heading;
	export let category;
	export let watched = false;
	export let nextTimer = '';

	$: watchedState_class = watched ? 'watched' : '';
	$: watchedState_title = watched ? 'Click to remove from watched list' : 'Click to add to watched list';

	const dispatch = createEventDispatcher();

	function toggleWatched() {
		watched = !watched;
		console.log('toggleWatched', { name, watched });
		dispatch('toggle-watched', {
			name,
			watched,
		});
	}
</script>

<div class="event">
	{#if icon}
		<img src={icon} alt={name} />
	{/if}

	<h3>{name}</h3>
	<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions svelte-ignore a11y-no-static-element-interactions-->
	<div class={`watched-state ${watchedState_class}`} title={watchedState_title} on:click={toggleWatched} />
</div>

<style lang="scss">
	.event {
		max-width: 21em;
		display: flex;
		flex-flow: row nowrap;
		padding: 0.5em;
		row-gap: 0.2em;
		column-gap: 0.6em;

		border-radius: 0.3125em;
		background-color: var(--gw2helper-module-white);
		box-shadow: var(--gw2helper-module-shadow);
		color: var(--gw2helper-module-text);
		flex: 0 1 auto;

		&:hover {
			box-shadow: var(--gw2helper-module-shadow-hover);
		}
	}
	.watched-state{
		background: url(/gw2helper/assets/rewards/map_heart-sprite.png) no-repeat top center;
		padding: 0;
		border-radius: 0;
		margin: 0;
		width: 2em;
		height: 2em;
		&.watched {
			background-position-y: -2em;
		}

	}
</style>
