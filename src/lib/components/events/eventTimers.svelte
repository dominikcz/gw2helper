<script>
	import helperUtils from '$lib/utils/helper-utils';
	import { onMount } from 'svelte';
	import wxdates from '$lib/wxjs_dates';
	import eventsUtils from './eventsUtils';
	import clock from '$lib/stores/clock';
	import themeWatcher from '$lib/stores/themeWatcher';

	export let showEventTimes = true;
	export let showChatLinks = true;
	export let showCategories = true;
	export let showHeadings = true;
	export let autoScroll = false;
	export let updateInterval = 10;

	let eventsRef;
	let pointerHeight = 0;

	let currentTimePos = 0;
	let currTime = new Date();
	let width = 0;
	let darkMode = themeWatcher();
	let dt0;
	let time = clock({ interval: updateInterval * 1000 });
	$: $time, updatePointerPos();

	onMount(() => {
		eventsUtils.init();
		hndResize();
		if (eventsRef.scrollLeft != 0){
			setTimeout(() => updatePointerPos(true), 1000); // give some time for animations and then reset pointer if it's off the screen at start
		}
	});

	function updatePointerPos(firstRun = false) {
		dt0 = eventsUtils.getDt0();
		if (!eventsRef) return;
		if (dt0) {
			const rect = eventsRef.getBoundingClientRect();
			pointerHeight = Math.trunc(rect.height);
			currTime = new Date();
			const diff = wxdates.minutesBetween(dt0, currTime);
			if (dt0.getHours() != currTime.getHours()) {
				console.log('reset.');
				currentTimePos = 0;
				eventsRef.scrollLeft = 0;
				eventsUtils.init();
				setTimeout(updatePointerPos, 0);
			} else {
				currentTimePos = 100 * (diff / 120);
				const timePosPx = currentTimePos * eventsRef.scrollWidth /100;

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

	function hndResize() {
		const rect = eventsRef.getBoundingClientRect();
		let scroll = eventsRef.scrollLeftMax;
		width = rect.width + scroll;
		updatePointerPos();
	}

</script>

<svelte:window on:resize={hndResize} />

<div class="event-timer" bind:this={eventsRef}>
	<div class="category time-container" class:no-headings={!showHeadings}>
		<div class="event-bar compact">
			<div class="event-pointer" title="Current time" style="left: {currentTimePos}%; height: {pointerHeight}px">
				<span class="event-pointer-time" style="right: inherit;">{eventsUtils.getHour(currTime)}</span>
			</div>
		</div>
		<div class="event-bar compact time">
			{#each eventsUtils.getTimeSegments(dt0) as segment}
				<div class="event" title={segment.name} style="width: {(segment.duration * 100) / 120}%;">
					{#if segment.name}
						<span>{segment.name}</span>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	{#each eventsUtils.getEntries(dt0) as [cat, eventsList]}
		<div class="category" class:no-headings={!showHeadings}>
			{#if showCategories}
				<h3>{cat}</h3>
			{/if}
			{#each eventsList as event}
				{#if showHeadings}
					{#if event.link}
						<a class="heading" href={helperUtils.wikiLink(event.link)} target="_blank" title={`${event.name} - read more on Wiki`}>{event.name}</a>
					{:else}
						<span class="heading">{event.name}</span>
					{/if}
				{/if}
				<div class="event-bar">
					{#each Object.values(event.segments) as segment}
						<div class="event" class:real={segment.name} title={segment.name} style="width: {(segment.duration * 100) / 120}%; background: {eventsUtils.getColor(segment.bg, $darkMode)};">
							{#if segment.name}
								<a href={helperUtils.wikiLink(segment.link)} target="_blank" title={`${segment.name} - read more on Wiki`} >{segment.name}</a>
								{#if showChatLinks && segment.chatlink}
									<span class="chatlink">{segment.chatlink}</span>
								{/if}
								{#if showEventTimes}
									<span>{`${eventsUtils.getHour(segment.start)} - ${eventsUtils.getHour(segment.stop)}`}</span>
								{/if}
							{/if}
						</div>
					{/each}
				</div>
			{/each}
		</div>
	{/each}

	<div class="category time-container bottom" class:no-headings={!showHeadings}>
		<div class="event-bar compact time">
			{#each eventsUtils.getTimeSegments(dt0) as segment}
				<div class="event" title={segment.name} style="width: {(segment.duration * 100) / 120}%;">
					{#if segment.name}
						<span>{segment.name}</span>
					{/if}
				</div>
			{/each}
		</div>
	</div>
</div>

<style lang="scss">
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
		h3 {
			background-color: var(--gw2helper-module-dark);
			padding: 0.3em 0.6em;
			margin: 0 0 0.3125em 0;
		}
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
			.event {
				margin: 0;
				padding: 0.3em 0 0.3em 0.4em;
			}
		}
		.event {
			display: flex;
			flex-flow: column nowrap;
			padding: 0.3125em;
			// word-break: break-all;
			overflow-wrap: break-word;

			// height: 4em;
			// overflow: hidden;
			// text-overflow: clip;

			&.real {
				border-left: 1px solid rgba(255, 255, 255, 0.3);
			}
			a {
				color: var(--gw2helper-link-color);
			}
		}
		&.time {
			position: sticky;
			top: 0;
			background-color: var(--gw2helper-module-white);
			z-index: 1;
			.event {
				border-left: 1px solid var(--gw2helper-module-dark);
				color: var(--gw2helper-module-text);
			}
		}
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

	@media (min-width: 900px) {
		.event-timer{
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
			h3 {
				grid-column: span 2;
			}
			.heading {
				grid-column: 1;
				margin-bottom: 0.3125em;
			}
			.event-bar {
				grid-column: 2;
			}
			&.no-headings {
				grid-template-columns: 1fr;
				.event-bar {
					grid-column: 1;
				}
				h3 {
					grid-column: 1;
				}
			}
		}
	}

</style>
