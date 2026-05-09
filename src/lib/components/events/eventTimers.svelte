<script lang="ts">
	import helperUtils from '$lib/utils/helper-utils';
	import { onMount } from 'svelte';
	import wxdates from '$lib/wxjs_dates';
	import eventsUtils from './eventsUtils';
	import Clock from '$lib/services/clock.svelte';
	import themeWatcher from '$lib/stores/themeWatcher';
	import EventTimerItem from './eventTimerItem.svelte';
	import EventTimerTime from './eventTimerTime.svelte';
	import { t as _ } from '$lib/services/i18n.js';
	import utils from '$lib/utils';

	/** @type {{showEventTimes?: boolean, showChatLinks?: boolean, showCategories?: boolean, showHeadings?: boolean, autoScroll?: boolean, updateInterval?: number}} */
	let { showEventTimes = true, showChatLinks = false, showCategories = true, showHeadings = true, autoScroll = false, updateInterval = 10 } = $props();

	let eventsRef = $state();
	let pointerHeight = $state(0);

	let currentTimePos = $state(0);
	// svelte-ignore state_referenced_locally
	let currTime = new Clock({ interval: updateInterval * 1000 });
	let darkMode = themeWatcher();
	let dt0 = $state();
	let oldTime = 0;

	let categoriesState = {};

	onMount(async () => {
		categoriesState = await utils.readEventTimerCategories();
		setTimeout(() => updatePointerPos(true), 1000); // give some time for animations and then reset pointer if it's off the screen at start
	});

	$effect(() => {
		if (oldTime != currTime.value) {
			updatePointerPos();
			oldTime = currTime.value;
		}
	});

	function updatePointerPos(firstRun = false) {
		dt0 = eventsUtils.getDt0();
		if (!eventsRef) return;
		const rect = eventsRef.getBoundingClientRect();
		pointerHeight = Math.trunc(rect.height);
		// console.log('h', pointerHeight);
		if (dt0) {
			const diff = wxdates.minutesBetween(dt0, currTime.value);
			if (dt0.getHours() != currTime.value.getHours()) {
				console.log('reset.');
				currentTimePos = 0;
				eventsRef.scrollLeft = 0;
				eventsUtils.init();
				setTimeout(updatePointerPos, 0);
			} else {
				currentTimePos = 100 * (diff / 120);
				const timePosPx = (currentTimePos * eventsRef.scrollWidth) / 100;

				// scroll to center if out of view
				// keep pointer positioned at center and scroll background
				if (firstRun || (autoScroll && timePosPx >= window.innerWidth - 16)) {
					const elem = document.querySelector('.event-pointer');
					// console.log('autoscrolling...');
					elem.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
				}
			}
		}
	}

	function hndCatToggle(cat, ev) {
		// console.log('hndCatToggle', cat, ev.newState);
		categoriesState[cat] = ev.newState == 'open';
		utils.saveEventTimerCategories(categoriesState);
		updatePointerPos();
	}

	function getCatState(cat) {
		const state = categoriesState[cat];
		if (state == undefined) return true;
		return state;
	}
</script>

<div class="event-timer" bind:this={eventsRef}>
	<div class="category time-container" class:no-headings={!showHeadings}>
		<div class="event-bar compact">
			<div class="event-pointer" title={$_('events.current_time')} style="left: {currentTimePos}%; height: {pointerHeight}px">
				<span class="event-pointer-time" style="right: inherit;">{eventsUtils.getHour(currTime.value)}</span>
			</div>
		</div>
		<EventTimerTime {dt0} />
	</div>

	{#snippet category(eventsList)}
		<div class="category" class:no-headings={!showHeadings}>
			{#each eventsList as event}
				{#if showHeadings}
					{#if event.link}
						<a class="heading" href={helperUtils.wikiLink(event.link)} target="_blank" title={`${event.name} - ${$_('common.read_more_on_wiki')}`}
							>{event.name}
						</a>
					{:else}
						<span class="heading">{event.name}</span>
					{/if}
				{/if}
				<EventTimerItem {event} {showChatLinks} {showEventTimes} darkMode={$darkMode} />
			{/each}
		</div>
	{/snippet}

	{#each eventsUtils.getEntries(dt0) as [cat, eventsList]}
		{#if showCategories}
			<details class="secondary" open={getCatState(cat)} ontoggle={(ev) => hndCatToggle(cat, ev)}>
				<summary>{cat}</summary>
				{@render category(eventsList)}
			</details>
		{:else}
			{@render category(eventsList)}
		{/if}
	{/each}

	<div class="category time-container bottom" class:no-headings={!showHeadings}>
		<EventTimerTime {dt0} />
	</div>
</div>

<style lang="scss">
	details {
		width: 100%;
		min-width: 75em;
	}
	.event-timer {
		// position: relative;
		display: flex;
		flex-flow: column nowrap;
		overflow-y: hidden;
		overflow-x: scroll;
	}

	.category {
		margin-bottom: 1em;
		width: 100%;
		min-width: 75em;
	}
	.heading {
		padding: 0.6em 0.6em;
		display: inline-block;
		background-color: var(--gw2helper-module);
		color: var(--gw2helper-module-text);
		width: 100%;
		// font-weight: bold;
		min-width: 75em;
	}

	.time-container {
		top: 0;
		min-width: 75em;
		width: 100%;
		// position: static;
		// margin: 0 1em;
		z-index: 10;
		background-color: var(--gw2helper-module-white);
		&.bottom {
			z-index: 1;
		}
	}

	.event-pointer {
		position: absolute;
		z-index: 11;
		// height: 101%;
		border-left: 2px solid red;
		margin-left: -1px;
		top: 0;
		transition: left 1s ease-in-out;
		cursor: help;
		scroll-margin-top: 13.125em;
	}

	.event-pointer-time {
		position: absolute;
		background: red;
		color: white;
		font-weight: bold;
		padding: 0.125em 0.375em;
		margin-left: -2px;
		white-space: nowrap;
		top: 0;
		z-index: 11;
	}

	.event-bar {
		position: relative;
		display: flex;
		flex-flow: row nowrap;
		min-height: 3em;
		min-width: 75em;
		margin-bottom: 0.3125em;
		color: #222;
		&.compact {
			min-height: auto;
			height: 1.6em;
		}
	}

	@media (min-width: 900px) {
		.event-timer {
			overflow-x: hidden;
		}
		.category {
			min-width: auto;
		}
		.heading {
			min-width: auto;
		}
		.event-bar {
			min-width: auto;
		}
		.time-container {
			min-width: auto;
		}
	}

	@media (min-width: 1200px) {
		.category {
			display: grid;
			grid-template-columns: 12.5em 1fr;
			grid-template-rows: minmax(3em, fit-content);
			gap: 0 0;
			grid-auto-rows: minmax(3em, fit-content);
			.heading {
				grid-column: 1;
				margin-bottom: 0.3125em;
			}
			:global(.event-bar) {
				grid-column: 2;
			}
			&.no-headings {
				grid-template-columns: 1fr;
				:global(.event-bar) {
					grid-column: 1;
				}
			}
		}
	}
</style>
