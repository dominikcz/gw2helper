<script>
	import wxdates from '$lib/wxjs_dates';
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import eventsUtils from './eventsUtils';
	import { stringify } from 'yaml';

	export let event;

	$: watchedState_class = event.watched ? 'watched' : '';
	$: watchedState_title = event.watched ? 'Click to remove from watched list' : 'Click to add to watched list';

	let timeLeft = '';
	let timerId;
	let darkMode = false;

	const dispatch = createEventDispatcher();

	function toggleWatched() {
		event.watched = !event.watched;
		dispatch('toggle-watched', {
			name: event.name,
			watched: event.watched,
		});
	}

	onMount(() => {
		// timerId = setTimeout(updateTime, 0);
		if (window.matchMedia) {
			if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
				darkMode = true;
			}
			window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', hndColorPrefChange);
		}
	});

	function hndColorPrefChange(event) {
		darkMode = event.matches;
		console.log('darkMode change', darkMode);
	}

	onDestroy(() => {
		// clearTimeout(timerId);
	});

	function updateTime() {
		if (nextTimer) {
			timeLeft = wxdates.friendlyDurationTill(new Date(), nextTimer);
			const msec = new Date().getMilliseconds();
			timerId = setTimeout(updateTime, 1000 - msec);
		}
	}
</script>

<div class="event" style="background: {eventsUtils.getColor(event.bg, darkMode)};" >
	<div class="header">
		<h4>{event.name}</h4>
		<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions svelte-ignore a11y-no-static-element-interactions-->
		<div class={`watched-state ${watchedState_class}`} title={watchedState_title} on:click={toggleWatched} />
	</div>
	{#if event.watched}
	<div class="body">
		{#each event.startTimes as time}
		<button>{time}</button>
		{/each}
	</div>
	<pre>
		{JSON.stringify(event, null, 4)}
	</pre>
	{/if}
</div>

<style lang="scss">
	.event {
		width: 21em;
		display: flex;
		flex-flow: column nowrap;
		padding: 0.5em;
		row-gap: 0.2em;
		column-gap: 0;

		border-radius: 0.3125em;
		background-color: var(--gw2helper-module-white);
		box-shadow: var(--gw2helper-module-shadow);
		color: var(--gw2helper-module-text);
		flex: 0 1 auto;

		.header{
			display: flex;
			flex-flow: row nowrap;
			justify-content: space-between;
		}

		.body{
			display: flex;
			flex-flow: row wrap;
			justify-content: flex-start;
			gap: 0.2em;
		}

		&:hover {
			box-shadow: var(--gw2helper-module-shadow-hover);
		}
	}
	.watched-state {
		background: url(/gw2helper/assets/rewards/map_heart-sprite.png) no-repeat top center;
		padding: 0;
		border-radius: 0;
		margin: 0;
		width: 2em;
		height: 2em;
		cursor: pointer;
		&.watched {
			background-position-y: -2em;
		}
	}
</style>
