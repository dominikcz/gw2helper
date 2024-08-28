<script>
	import { base } from '$app/paths';
	import { Howl } from 'howler';
	import EventsList from './eventsList.svelte';
	import SearchInput from '../searchInput.svelte';
	import helperUtils from '$lib/utils/helper-utils';
	import EventsCategory from './eventsCategory.svelte';
	import eventsUtils from './eventsUtils';
	import { onMount, onDestroy } from 'svelte';

	export let events;
	export let watched;
	export let showChatLinks = false;
	export let updateInterval = 10;

	let filter = '';

	let inAdvance = 5;
	let sounds = new Howl({
		src: [`${base}/assets/sounds/alarms.mp3`],
		sprite: {
			trumpet: [0, 5923],
			squeeze: [5924, 6903],
		},
	});
	let sound = 'trumpet';

	let alarms = [];

	let timer;

	function getWatched(events, watched) {
		const _watched = [];
		Object.keys(events).forEach((cat) => {
			const _events = events[cat].filter((x) => watched.includes(x.name)).map((x) => ({ ...x, watched: true }));
			_watched.push(..._events);
		});
		return _watched;
	}

	function getNotWatched(events, watched, filter) {
		const notWatched = events.filter((x) => !watched.includes(x.name)).map((x) => ({ ...x, watched: false }));
		return helperUtils.filterCollection(notWatched, ['name'], filter);
	}

	function playAlarm() {
		sounds.play(sound);
	}

	onMount(() => {
		timer = setTimeout(() => update(), 0);
	});

	onDestroy(() => {
		clearTimeout(timer);
	});

	function updateNextEvents() {
		Object.keys(events).forEach((catKey) => {
			const cat = events[catKey];
			let changed = false;
			cat.forEach((event) => {
				const newNext = eventsUtils.getNextOccurence(event.startTimes, new Date());
				if (event.next != newNext) {
					event.next = newNext;
					changed = true;
				}
			});
			if (changed) {
				events = events;
			}
		});
	}

	function update() {
		updateNextEvents();
		const dt = new Date();
		const msecLeft = 60000 - dt.getSeconds() * 1000 + dt.getMilliseconds();
		const nextTick = Math.min(updateInterval * 1000, msecLeft);
		timer = setTimeout(() => update(), nextTick);
	}
</script>

<fieldset class="settings">
	<legend>Reminder settings</legend>
	{#if inAdvance}
		<p>Notify me {inAdvance} minutes before the event</p>
	{:else}
		<p>Notify me when the event starts</p>
	{/if}
	<input type="range" name="vol" min="0" max="10" step="1" bind:value={inAdvance} />
	<h4>Alarm sound</h4>
	<div style="width: 100%">
		{#each ['trumpet', 'squeeze'] as name}
			<label>
				<input type="radio" name="sounds" value={name} bind:group={sound} />
				{name}
			</label>
		{/each}
	</div>
	<button on:click={playAlarm}>test alarm ({sound})</button>
</fieldset>

<h2>Watched:</h2>
<EventsList events={getWatched(events, watched)} on:toggle-watched on:toggle-alarm>
	You have not added anything to the list yet. Add items by clicking
	<img src="{base}/assets/rewards/map_heart_empty.png" alt="not on list" class="icon-small" />
	icon on any of the events below.
</EventsList>

<h2>Available:</h2>
<section>
	<SearchInput bind:value={filter} name="filter" id="filter" placeholder="list too long?" />
</section>

{#each Object.keys(events) as cat}
	{@const notWatched = getNotWatched(events[cat], watched, filter)}
	{#if notWatched}
		<EventsCategory events={notWatched} {showChatLinks} category={cat} on:toggle-watched />
	{/if}
{/each}

<style lang="scss">
	h2 {
		margin-top: 1em;
	}
</style>
