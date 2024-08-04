<script>
	import helperUtils from '$lib/utils/helper-utils';
	import { onMount, onDestroy } from 'svelte';
	import wxdates from '$lib/wxjs_dates';
	export let wikiData;
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
	let dt0;
	let width = 0;
	let interval;
	const et = new Map();

	init();

	interval = setInterval(() => {
		updatePointerPos();
	}, updateInterval * 1000);

	onMount(() => {
		hndResize();
	});

	onDestroy(() => {
		console.log('cleaning up');
		clearInterval(interval);
	});

	function updatePointerPos() {
		if (dt0) {
			const rect = eventsRef.getBoundingClientRect();
			pointerHeight = rect.height;
			currTime = new Date();
			const diff = wxdates.minutesBetween(dt0, currTime);
			if (dt0.getHours() != currTime.getHours()) {
				console.log('reset.');
				currentTimePos = 0;
				eventsRef.scrollLeft = 0;
				init();
			} else {
				currentTimePos = 100 *  (diff / 120);
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

	function init() {
		et.clear();
		const _dt0 = new Date();
		_dt0.setHours(_dt0.getHours(), 0, 0, 0);
		dt0 = new Date(_dt0);

		for (const [key, value] of Object.entries(wikiData)) {
			let category = value['category'] || '';
			if (category) {
				if (!et.has(category)) {
					et.set(category, []);
				}
				let list = et.get(category);
				list.push({
					name: value.name,
					link: value.link,
					segments: getCurrentWindow(dt0, fillCalendar(value.segments, value.sequences, 48), 2),
				});
			}
		}
	}

	function getCurrentWindow(dt0, segments, hours = 2) {
		const dt1 = wxdates.dateAdd(dt0, 'hours', hours);
		const dt0t = dt0.getTime();
		const dt1t = dt1?.getTime();

		const filtered = segments.filter(
			(x) =>
				(x.start.getTime() >= dt0t && x.stop.getTime() <= dt1t) ||
				(x.start.getTime() <= dt0t && x.stop.getTime() > dt0t) ||
				(x.start.getTime() < dt1t && x.stop.getTime() >= dt1t) ||
				(x.start.getTime() < dt0t && x.stop.getTime() >= dt1t)
		);

		filtered.forEach((x) => {
			// for presentation purposes we have to adjust length of segments that start before dt0
			if (x.start.getTime() < dt0t) {
				const diff = wxdates.minutesBetween(x.start, dt0);
				// we keep original start hour in x.start and adjust duration
				x.duration -= diff;
			}

			// similarly for events that span outside our window
			if (x.stop.getTime() > dt1t) {
				const diff = wxdates.minutesBetween(x.start, dt1);
				// we keep original start hour in x.stop and adjust duration
				x.duration = diff;
			}
		});
		return filtered;
	}

	function getEventData(ev, duration, time) {
		// console.log('   - evData:', {duration, time});

		let t1 = wxdates.dateAdd(time, 'minutes', duration);
		let t0 = new Date(time);
		time.setTime(t1.getTime());
		return { ...ev, start: t0, stop: t1, duration };
	}

	function fillCalendar(segments, sequences, hours = 24) {
		const t = new Date();
		t.setUTCHours(0, 0, 0, 0); // reset time part to 00:00:00.000 UTC
		const tmax = wxdates.dateAdd(t, 'hours', hours);
		const sched = [];

		for (const def of sequences.partial) {
			let ev = segments[def.r];
			sched.push(getEventData(ev, def.d, t));
		}
		let i = 0;
		do {
			i++;
			for (const def of sequences.pattern) {
				let ev = segments[def.r];
				sched.push(getEventData(ev, def.d, t));
			}
		} while (t.getTime() < tmax?.getTime() && i < 10 * hours);
		return sched;
	}

	function getHour(dt) {
		return dt.toLocaleTimeString('pl-PL').slice(0, 5);
	}

	function getTimeSegments(dt0, hours = 2) {
		let dt = new Date(dt0);
		const sched = [];
		const duration = 15;
		dt.setUTCHours(dt.getUTCHours(), 0, 0, 0);
		for (let i = 0; i < hours * 4; i++) {
			let dt1 = wxdates.dateAdd(dt, 'minutes', duration);
			sched.push({ name: getHour(dt), start: dt, stop: dt1, duration });
			dt = new Date(dt1);
		}
		return sched;
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
				<span class="event-pointer-time" style="right: inherit;">{getHour(currTime)}</span>
			</div>
		</div>
		<div class="event-bar compact time">
			{#each getTimeSegments(dt0) as segment}
				<div class="event" title={segment.name} style="width: {(segment.duration * 100) / 120}%;">
					{#if segment.name}
						<span>{segment.name}</span>
					{/if}
				</div>
			{/each}
		</div>
	</div>

	{#each et.entries() as [cat, eventsList]}
		<div class="category" class:no-headings={!showHeadings}>
			{#if showCategories}
				<h3>{cat}</h3>
			{/if}
			{#each eventsList as event}
				{#if showHeadings}
					{#if event.link}
						<a class="heading" href={helperUtils.wikiLink(event.link)} target="_blank">{event.name}</a>
					{:else}
						<span class="heading">{event.name}</span>
					{/if}
				{/if}
				<div class="event-bar">
					{#each Object.values(event.segments) as segment}
						<div
							class="event"
							title={segment.name}
							style="width: {(segment.duration * 100) / 120}%; background-color: rgb({segment.bg.join(',')});"
						>
							{#if segment.name}
								<a href={helperUtils.wikiLink(segment.link)} target="_blank">{segment.name}</a>
								{#if showChatLinks && segment.chatlink}
									<span class="chatlink">{segment.chatlink}</span>
								{/if}
								{#if showEventTimes}
									<span>{`${getHour(segment.start)} - ${getHour(segment.stop)}`}</span>
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
			{#each getTimeSegments(dt0) as segment}
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
		width: 100%;
		// font-weight: bold;
	}
	.event-bar {
		position: relative;
		display: flex;
		flex-flow: row nowrap;
		min-height: 3em;
		// min-width: 1200px;
		margin-bottom: 0.3125em;
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
		}
		&.time {
			position: sticky;
			top: 0;
			background-color: var(--gw2helper-module-white);;
			z-index: 1;
			.event {
				border-left: 1px solid var(--gw2helper-module-dark);
			}
		}
	}

	.time-container {
		top: 0;
		// min-width: 1200px;
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
