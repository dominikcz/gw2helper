<script>
	import { base } from '$app/paths';
	import { Howl } from 'howler';
	import EventsList from './eventsList.svelte';
	import SearchInput from '../searchInput.svelte';
	import helperUtils from '$lib/utils/helper-utils';
	import EventsCategory from './eventsCategory.svelte';

	export let events;
	export let watched;

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

	function getWatched(events, watched) {
		const _watched = [];
		Object.keys(events).forEach(cat => {
			const _events = events[cat].filter(x => watched.includes(x.name)).map((x) => ({ ...x, watched: true }));
			_watched.push(..._events)
		})
		return _watched;
	}

	function getNotWatched(events, watched, filter) {
		const notWatched = events.filter((x) => !watched.includes(x.name)).map((x) => ({ ...x, watched: false }));
		return helperUtils.filterCollection(notWatched, ['name'], filter);
	}

	function playAlarm() {
		sounds.play(sound);
	}
</script>

<div>
	<fieldset>
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
	<EventsList events={getWatched(events, watched)} on:toggle-watched on:toggle-alarm/>

	<pre>
	{JSON.stringify(alarms, null, 4)}
	</pre>


	<h2>Available:</h2>
	<section>
		<label for="filter">Filter:</label>
		<SearchInput bind:value={filter} name="filter" id="filter" placeholder="list too long?" />
	</section>

	{#each Object.keys(events) as cat}
		{@const notWatched = getNotWatched(events[cat], watched, filter)}
		{#if notWatched}
			<EventsCategory events={notWatched} category={cat} on:toggle-watched />
		{/if}
	{/each}
</div>

<style lang="scss">
	h2 {
		margin-top: 1em;
	}
</style>
