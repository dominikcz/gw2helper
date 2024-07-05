<script>
	import helperUtils from '$lib/utils/helper-utils';
import wxdates from '$lib/wxjs_dates';
	export let wikiData;

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
				segments: getCurrentWindow(fill24h(value.segments, value.sequences)),
			});
		}
	}
	// console.log('et', et);

	function getCurrentWindow(segments, hours = 2) {
		const currTime = new Date();
		const dt0 = new Date(currTime);
		dt0.setUTCMilliseconds(0);
		dt0.setUTCSeconds(0);
		dt0.setUTCMinutes(0);
		dt0.setUTCHours(Math.floor(dt0.getUTCHours() / hours) * hours);
		const dt1 = wxdates.dateAdd(dt0, 'hours', hours);
		const dt0t = dt0.getTime();
		const dt1t = dt1?.getTime();
		// console.log('filtering', [dt0.toLocaleTimeString(), dt1.toLocaleTimeString(), hours]);

		return segments.filter(
			(x) =>
				(x.start.getTime() >= dt0t && x.stop.getTime() <= dt1t) ||
				(x.start.getTime() < dt0t && x.stop.getTime() > dt0t) ||
				(x.start.getTime() < dt1t && x.stop.getTime() > dt1t)
		);
	}

	function getEventData(ev, duration, time) {
		// console.log('   - evData:', {duration, time});

		let t1 = wxdates.dateAdd(time, 'minutes', duration);
		let t0 = new Date(time);
		time.setTime(t1.getTime());
		return { ...ev, start: t0, stop: t1, duration };
	}

	function fill24h(segments, sequences) {
		const t0 = new Date();
		let t = new Date(t0);
		const tmax = wxdates.dateAdd(t0, 'hours', 24);
		t.setUTCHours(0, 0, 0, 0); // Time 00:00:00.000 UTC
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
		} while (t.getTime() < tmax?.getTime() && i < 240);
		// console.log('repeated', i);
		return sched;
	}
</script>

<main class="event-timer">
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
								<span class="chatlink">{segment.chatlink}</span>
							{/if}
						</div>
					{/each}
				</div>
			{/each}
		</div>
	{/each}
</main>

<style lang="scss">
	.event-timer {
		display: flex;
		flex-flow: column nowrap;
		overflow-x: scroll;
		.category {
			width: 100%;
			h3 {
				background-color: var(--gw2helper-module);
			}
		}
		.event-bar {
			display: flex;
			flex-flow: row nowrap;
			min-height: 3rem;
			min-width: 1200px;
			.event {
				display: flex;
				flex-flow: column nowrap;
				padding: 5px;
			}
		}
	}
</style>
