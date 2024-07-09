<script>
	import helperUtils from '$lib/utils/helper-utils';
	import { onDestroy } from 'svelte';
	import wxdates from '$lib/wxjs_dates';
	export let wikiData;
	let currentTimePos = 0;
	let currTime = new Date();
	let interval = setInterval(() => {
		currTime = new Date();
		const dt0 = new Date();
		dt0.setHours(dt0.getHours(), 0, 0, 0);
		const diff = wxdates.minutesBetween(dt0, currTime);
		// console.log('interval', [getHour(dt0), getHour(currTime), diff]);
		currentTimePos = (diff * 100) / 120;
	}, 1000);

	onDestroy(() => {
		clearInterval(interval);
	});

	const et = new Map();

	for (const [key, value] of Object.entries(wikiData)) {
		let category = value['category'] || '';
		if (category) {
			if (!et.has(category)) {
				et.set(category, []);
			}
			let list = et.get(category);
			list.push({
				name: value.name,
				segments: getCurrentWindow(fillCalendar(value.segments, value.sequences, 48), 2),
			});
		}
	}
	// console.log('et', et);

	function getCurrentWindow(segments, hours = 2) {
		const dt0 = new Date();
		dt0.setUTCHours(dt0.getUTCHours(), 0, 0, 0);
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
			// console.log('   - part:', def);
			let ev = segments[def.r];
			sched.push(getEventData(ev, def.d, t));
		}
		let i = 0;
		do {
			i++;
			for (const def of sequences.pattern) {
				// console.log('   - patern:', def);
				let ev = segments[def.r];
				sched.push(getEventData(ev, def.d, t));
				// if (t.getTime() >= tmax?.getTime()) {
				//     break;
				// }
			}
		} while (t.getTime() < tmax?.getTime() && i < 10 * hours);
		// console.log('repeated', i);
		return sched;
	}

	function getHour(dt) {
		return dt.toLocaleTimeString('pl-PL').slice(0, 5);
	}

	function getTimeSegments(hours = 2) {
		let dt = new Date();
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
</script>

<div class="event-timer">
	<div class="event-bar compact">
		<div class="event-pointer" title="Current time" style="left: {currentTimePos}%;">
			<span class="event-pointer-time" style="right: inherit;">{getHour(currTime)}</span>
		</div>
	</div>
	<div class="event-bar compact time">
		{#each getTimeSegments() as segment}
			<div class="event" title={segment.name} style="width: {(segment.duration * 100) / 120}%;">
				{#if segment.name}
					<span>{segment.name}</span>
				{/if}
			</div>
		{/each}
	</div>
	{#each et.entries() as [cat, eventsList]}
		<div class="category">
			<h3>{cat}</h3>
			{#each eventsList as event}
				<a class="heading" href={helperUtils.wikiLink(event.link)} target="_blank">{event.name}</a>
				<div class="event-bar">
					{#each Object.values(event.segments) as segment}
						<div
							class="event"
							title={segment.name}
							style="width: {(segment.duration * 100) / 120}%; background-color: rgb({segment.bg.join(',')});"
						>
							{#if segment.name}
								<a href={helperUtils.wikiLink(segment.link)} target="_blank">{segment.name}</a>
							{/if}
							{#if segment.chatlink}
								<span class="chatlink">{segment.chatlink}</span>
							{/if}
							<span>{`${getHour(segment.start)} - ${getHour(segment.stop)}`}</span>
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
		width: 100%;
		h3 {
			background-color: var(--gw2helper-module);
			padding: 0.3rem 0.6rem;
			margin: 0;
		}
	}
	.heading {
		padding: 0.3rem 0.6rem;
		display: inline-block;
	}
	.event-bar {
		display: flex;
		flex-flow: row nowrap;
		min-height: 3rem;
		min-width: 1200px;
		&.compact {
			min-height: auto;
			.event {
				margin: 0;
				padding: 0.3rem 0 0.3rem 0.4rem;
			}
		}
		.event {
			display: flex;
			flex-flow: column nowrap;
			padding: 5px;
		}
		&.time {
			position: sticky;
			top: 0;
			background-color: #fff;
			z-index: 1;
			.event {
				border-left: 1px solid #333;
			}
		}
	}

	.event-pointer {
		position: absolute;
		z-index: 2;
		height: 101%;
		border-left: 2px solid red;
		margin-left: -1px;
		top: 0;
		transition: left 1s ease-in-out;
		cursor: help;
	}

	.event-pointer-time {
		position: absolute;
		background: red;
		color: white;
		font-weight: bold;
		padding: 2px 6px;
		margin-left: -2px;
		white-space: nowrap;
		top: -1.4rem;
	}
</style>
