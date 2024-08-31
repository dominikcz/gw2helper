<script>
	import { createEventDispatcher } from 'svelte';
	import eventsUtils from './eventsUtils';
	import helperUtils from '$lib/utils/helper-utils';
	import Chips from '../chips/chips.svelte';
	import themeWatcher from '$lib/stores/themeWatcher';
	import clock from '$lib/stores/clock';

	export let event;
	export let showChatLinks = false;

	$: watchedState_class = event.watched ? 'watched' : '';
	$: watchedState_title = event.watched ? 'Click to remove from watched list' : 'Click to add to watched list';
	// $: event.alarms, toggleAlarm(event);

	let darkMode = themeWatcher();
	let currentTime = clock({ interval: 10000 });

	const dispatch = createEventDispatcher();

	function toggleWatched() {
		event.watched = !event.watched;
		event.alarms = [];
		dispatch('toggle-watched', {
			name: event.name,
			watched: event.watched,
		});
	}

	function toggleAlarm() {
		dispatch('toggle-alarm', {
			name: event.name,
			alarms: event.alarms,
		});
	}

</script>

<div class="event" style="background: {eventsUtils.getColor(event.bg, $darkMode)};">
	<div class="header">
		<a href={helperUtils.wikiLink(event.link)} title={`${event.name} - read more on Wiki`} target="_blank">{event.name}</a>
		<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions svelte-ignore a11y-no-static-element-interactions-->
		<div class={`watched-state ${watchedState_class}`} title={watchedState_title} on:click={toggleWatched} />
	</div>
	<div class="body">
		{#if event.watched}
			{#if showChatLinks}
				<span>{event.chatlink}</span>
			{/if}
			<h5>Choose the times for your alarms:</h5>
			<Chips options={event.startTimes} value={event.alarms} />
		{:else}
			<span>Next: {event.next}</span>
		{/if}
	</div>
</div>

<style lang="scss">
	.event {
		width: 20em;
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

		:global(span svg) {
			vertical-align: middle;
		}
		h5 {
			margin: 1em 0 0.3em 0;
		}
		.header {
			display: flex;
			flex-flow: row nowrap;
			justify-content: space-between;
			align-items: flex-start;
			a {
				color: var(--gw2helper-module-text);
			}
		}

		.body {
			display: flex;
			flex-flow: column wrap;
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
		flex-shrink: 0;
		&.watched {
			background-position-y: -2em;
		}
	}

	@media (min-width: 40em) {
		.event {
			width: 21em;
		}
	}
</style>
