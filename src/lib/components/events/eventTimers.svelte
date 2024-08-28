<script>
	import helperUtils from '$lib/utils/helper-utils';
	import { onMount, onDestroy } from 'svelte';
	import wxdates from '$lib/wxjs_dates';
	import eventsUtils from './eventsUtils';
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
	let timer;
	let darkMode = false;
	let dt0;

	onMount(() => {
		if (window.matchMedia) {
			if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
				darkMode = true;
			}
			console.log('darkMode', darkMode);
			window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', hndColorPrefChange);
		}
		hndResize();
		timer = setTimeout(() => update(), 0)
	});

	onDestroy(() => {
		console.log('cleaning up');
		clearTimeout(timer);
		if (window.matchMedia) {
			window.matchMedia('(prefers-color-scheme: dark)').removeEventListener('change', hndColorPrefChange);
		}
	});

	function update(){
		updatePointerPos();
		const dt = new Date();
		const msecLeft = 60000 - dt.getSeconds()* 1000 + dt.getMilliseconds();
		const nextTick = Math.min(updateInterval * 1000, msecLeft);
		timer = setTimeout(() => update(), nextTick);
	}

	function hndColorPrefChange(event) {
		darkMode = event.matches;
		console.log('darkMode change', darkMode);
	}

	function updatePointerPos() {
		dt0 = eventsUtils.getDt0();
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
				// scroll to center if out of view:
				// if (autoScroll && (currentTimePos < eventsRef.scrollLeft || currentTimePos > eventsRef.scrollLeft + window.innerWidth - 16)) {

				// keep pointer positioned at center and scroll background
				if (autoScroll && currentTimePos != window.innerWidth - 16) {
					// console.log('autoscrolling...');
					const elem = document.querySelector('.event-pointer');
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
						<div class="event" title={segment.name} style="width: {(segment.duration * 100) / 120}%; background: {eventsUtils.getColor(segment.bg, darkMode)};">
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

	@media (min-width: 1200px) {
		.category {
			display: grid;
			grid-template-columns: 12.5em 1fr;
			grid-template-rows: minmax(3em, fit-content);
			gap: 0 0;
			grid-auto-rows: minmax(3em, fit-content);
			min-width: auto;
			h3 {
				grid-column: span 2;
			}
			.heading {
				grid-column: 1;
				margin-bottom: 0.3125em;
				min-width: auto;
			}
			.event-bar {
				grid-column: 2;
				min-width: auto;
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
		.time-container {
			min-width: auto;
		}
	}
</style>
