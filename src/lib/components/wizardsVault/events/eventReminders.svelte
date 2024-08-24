<script>
	import EventsList from './eventsList.svelte';
	import { base } from '$app/paths';
	import { Howl } from 'howler';

	export let events;
	export let watched;

	let inAdvance = 5;
	let sounds = new Howl({
		src: [`${base}/assets/sounds/alarms.mp3`],
		sprite: {
			trumpet: [0, 5923],
			squeeze: [5924, 6903],
		},
	});
	let sound = 'trumpet';

	function getWatched(events, watched) {
		return events.filter((x) => watched.includes(x.name)).map((x) => ({ ...x, watched: true }));
	}

	function getNotWatched(events, watched) {
		return events.filter((x) => !watched.includes(x.name)).map((x) => ({ ...x, watched: false }));
	}

	function playAlarm() {
		// Shoot the laser!
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
					<input type="radio" name="sounds" value={name} bind:group={sound} /> {name}
				</label>
			{/each}
		</div>
		<button on:click={playAlarm}>test alarm ({sound})</button>
	</fieldset>
	<h2>Watched:</h2>
	<EventsList events={getWatched(events, watched)} on:toggle-watched />
	<h2>Available:</h2>
	<EventsList events={getNotWatched(events, watched)} on:toggle-watched />
</div>
