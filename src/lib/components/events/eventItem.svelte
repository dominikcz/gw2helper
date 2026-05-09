<script lang="ts">
	import eventsUtils from './eventsUtils';
	import helperUtils from '$lib/utils/helper-utils';
	import Chips from '../chips/chips.svelte';
	import themeWatcher from '$lib/stores/themeWatcher';
	import { t as _ } from '$lib/services/i18n.js';
	import WatchState from '../watch-state/watch-state.svelte';

	/** @type {{event: any, onToggleWatched?: CallableFunction, onAlarmsChange?: CallableFunction, showChatLinks?: boolean}} */
	let { event = $bindable(), showChatLinks = false, onToggleWatched = () => {}, onAlarmsChange = () => {} } = $props();

	let watchedState_class = $derived(event.watched ? 'watched' : '');
	let watchedState_title = $derived(event.watched ? $_('events.click_to_remove') : $_('events.click_to_add'));
	// $: event.alarms, toggleAlarm();

	let darkMode = themeWatcher();

	function toggleWatched() {
		event.watched = !event.watched;
		onToggleWatched({
			name: event.name,
			watched: event.watched,
		});
	}

	function hndHoursChange(ev) {
		onAlarmsChange({
			name: ev.name,
			alarms: [...ev.value],
		});
	}
</script>

<div class="event" style="background: {eventsUtils.getColor(event.bg, $darkMode)};">
	<div class="header">
		{#if event.link}
			<a href={helperUtils.wikiLink(event.link)} title={`${event.name} - ${$_('common.read_more_on_wiki')}`} target="_blank">{event.name}</a>
		{:else}
			<span>{event.name}</span>
		{/if}
		<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions, a11y_no_static_element_interactions-->
		<!--<div class={`watched-state ${watchedState_class}`} title={watchedState_title} on:click={toggleWatched} />-->
		<WatchState title={watchedState_title} watched={event.watched} onClick={toggleWatched} />
	</div>
	<div class="body">
		{#if event.watched}
			{#if showChatLinks}
				<span>{event.chatlink}</span>
			{/if}
			<h5>{$_('events.watched.choose_times')}</h5>
			<Chips name={event.name} options={event.startTimes} value={event.alarms} onChipsChange={hndHoursChange} />
		{:else if event.next}
			<span>{$_('events.next_event')} {event.next}</span>
		{/if}
	</div>
</div>

<style lang="scss">
	.event {
		max-width: 24em;
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

	@media (min-width: 40em) {
		.event {
			width: 24em;
		}
	}
</style>
