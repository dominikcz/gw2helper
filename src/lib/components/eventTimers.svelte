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

	function updatePointerPos(){
		if (dt0) {
			currTime = new Date();
			const diff = wxdates.minutesBetween(dt0, currTime);
			if (dt0.getHours() != currTime.getHours()) {
				console.log('reset.');
				currentTimePos = 0;
				eventsRef.scrollLeft = 0;
				init();
			} else {
				currentTimePos = (diff / 120) * width;
				// scroll to center if out of view:
				// if (autoScroll && (currentTimePos < eventsRef.scrollLeft || currentTimePos > eventsRef.scrollLeft + window.innerWidth - 16)) {

				// keep pointer positioned at center and scroll background
				if (autoScroll && (currentTimePos != window.innerWidth - 16)) {
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
	<div class="time-container">
		<div class="event-bar compact">
			<div class="event-pointer" title="Current time" style="left: {currentTimePos}px;">
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
		<div class="category">
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
</div>

<style lang="scss">
	.event-timer {
		position: relative;
		display: flex;
		flex-flow: column nowrap;
		overflow-y: hidden;
		overflow-x: scroll;
	}

	.category {
		margin-bottom: 1rem;
		width: 100%;
		h3 {
			background-color: var(--gw2helper-module-dark);
			padding: 0.3rem 0.6rem;
			margin: 0;
		}
	}
	.heading {
		padding: 0.6rem 0.6rem;
		display: inline-block;
		background-color: var(--gw2helper-module);
		width: 100%;
		// font-weight: bold;
	}
	.event-bar {
		display: flex;
		flex-flow: row nowrap;
		min-height: 3rem;
		min-width: 1200px;
		&.compact {
			min-height: auto;
			height: 1.6rem;
			.event {
				margin: 0;
				padding: 0.3rem 0 0.3rem 0.4rem;
			}
		}
		.event {
			display: flex;
			flex-flow: column nowrap;
			padding: 5px;
			// word-break: break-all;
			overflow-wrap: break-word;
		}
		&.time {
			position: sticky;
			top: 0;
			background-color: #fff;
			z-index: 1;
			.event {
				border-left: 1px solid #aaa;
			}
		}
	}

	.time-container {
		top: 0;
		min-width: 1200px;
		width: 100%;
		// position: static;
		// margin: 0 1rem;
		z-index: 10;
		background-color: #fff;
	}

	.event-pointer {
		position: absolute;
		z-index: 11;
		height: 101%;
		border-left: 2px solid red;
		margin-left: -1px;
		top: 0;
		transition: left 1s ease-in-out;
		cursor: help;
		scroll-margin-top: 210px;
	}

	.event-pointer-time {
		position: absolute;
		background: red;
		color: white;
		font-weight: bold;
		padding: 2px 6px;
		margin-left: -2px;
		white-space: nowrap;
		top: 0;
		z-index: 11;
	}
</style>
