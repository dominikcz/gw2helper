<script>
	import wxdates from '$lib/wxjs_dates';
	import { createEventDispatcher, onDestroy, onMount } from 'svelte';
	import eventsUtils from './eventsUtils';
	import helperUtils from '$lib/utils/helper-utils';
	import Wiki from '../wiki.svelte';
	import Chips from '../chips/chips.svelte';

	export let event;

	$: watchedState_class = event.watched ? 'watched' : '';
	$: watchedState_title = event.watched ? 'Click to remove from watched list' : 'Click to add to watched list';
	// $: event.alarms, toggleAlarm(event);

	let timeLeft = '';
	let timerId;
	let darkMode = false;

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

<div class="event" style="background: {eventsUtils.getColor(event.bg, darkMode)};">
	<div class="header">
		<h4>{event.name}</h4>
		<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions svelte-ignore a11y-no-static-element-interactions-->
		<div class={`watched-state ${watchedState_class}`} title={watchedState_title} on:click={toggleWatched} />
	</div>
	{#if event.watched}
		<span>
			{event.chatlink}
			<a href={helperUtils.wikiLink(event.link)} target="_blank">
				<Wiki width="1.8em" height="1.2em" />
			</a>
		</span>
		<h5>Choose the times for your alarms:</h5>
		<div class="body">
			<Chips options={event.startTimes} value={event.alarms} />
		</div>
	{/if}
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
		h5{
			margin: 1em 0 0.3em 0;
		}
		.header {
			display: flex;
			flex-flow: row nowrap;
			justify-content: space-between;
			align-items: flex-start;
		}

		.body {
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
		flex-shrink: 0;
		&.watched {
			background-position-y: -2em;
		}
	}
</style>
