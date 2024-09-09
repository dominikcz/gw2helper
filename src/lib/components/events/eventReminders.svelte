<script>
	import { base } from '$app/paths';
	import { Howl } from 'howler';
	import EventsList from './eventsList.svelte';
	import SearchInput from '../searchInput.svelte';
	import helperUtils from '$lib/utils/helper-utils';
	import EventsCategory from './eventsCategory.svelte';
	import eventsUtils from './eventsUtils';
	import clock from '$lib/stores/clock';
	import Reminders from '$lib/reminders';
	import { EVENTS_PARTIAL, EVENT_TEMPLATE } from '$lib/components/events/tts';
	import mustache from 'mustache';

	export let events;
	export let showChatLinks = false;
	export let updateInterval = 60;

	let filter = '';

	let inAdvance = 5;
	let sounds = new Howl({
		src: [`${base}/assets/sounds/alarms.mp3`],
		sprite: {
			trumpet: [0, 5923],
			squeeze: [5924, 850],
			notif3: [6834, 1160],
			notif9: [8000, 2182],
		},
	});
	let sound = 'trumpet';

	let time = clock({ interval: updateInterval * 1000 });
	let reminders = new Reminders();

	const remindersStore = reminders.$store;

	let version = 0;

	$: $time, onTimeChange();

	function hndAlarmsChange(event) {
		const ev = event.detail;
		reminders.updateAlarms(ev.name, ev.alarms);
	}

	function getWatched(ver) {
		const _watched = [];
		Object.keys(events).forEach((cat) => {
			events[cat].forEach((x) => {
				const hours = reminders.getAlarms(x.name);
				if (x.watched || hours != undefined) {
					x.watched = true;
					x.alarms = [...(hours || [])];
					_watched.push(x);
				}
			});
		});
		return _watched;
	}

	function getNotWatched(events, filter, ver) {
		const notWatched = events.filter((x) => !x.watched);
		return helperUtils.filterCollection(notWatched, ['name'], filter);
	}

	function getEvent(name) {
		let _event;
		Object.keys(events).some((cat) => {
			_event = events[cat].find((x) => x.name == name);
			return _event !== undefined;
		});
		return _event;
	}

	function playAlarm(info) {
		if (info) {
			let tts = mustache.render(EVENT_TEMPLATE, info, EVENTS_PARTIAL);

			// console.log('tts', { info, tts });
			sounds.on('end', function () {
				var msg = new SpeechSynthesisUtterance();
				msg.text = tts;
				msg.volume = 1; // From 0 to 1
				msg.rate = 1; // From 0.1 to 10
				msg.pitch = 1; // From 0 to 2
				window.speechSynthesis.speak(msg);
			});
		} else {
			sounds.on('end', null);
		}
		sounds.stop();
		sounds.play(sound);
	}

	function updateNextEvents() {
		Object.keys(events).forEach((catKey) => {
			const cat = events[catKey];
			let changed = false;
			cat.forEach((event) => {
				const newNext = eventsUtils.getNextOccurence(event.startTimes, $time);
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

	function onTimeChange() {
		updateNextEvents();

		const list = reminders.activeAlarms($time, inAdvance);
		// const list = ['event 1', 'event 2']; // test
		if (list.length) {
			playAlarm({
				time: eventsUtils.getHour($time),
				eventsList: list.join(', '),
				inAdvance,
				immediate: inAdvance == 0,
				plural: list.length > 1,
			});
		}
	}

	async function hndToggleWatched(event) {
		const obj = event.detail;
		const _event = getEvent(obj.name);
		if (obj.watched) {
			_event.alarms = [];
			_event.watched = true;
			reminders.addEvent(obj.name);
		} else {
			_event.watched = false;
			reminders.deleteEvent(obj.name);
		}
		version++;
	}
</script>

<h2>Watched:</h2>
<EventsList events={getWatched(version)} on:toggle-watched={hndToggleWatched} on:alarms-change={hndAlarmsChange}>
	You have not added anything to the list yet. Add items by clicking
	<img src="{base}/assets/rewards/map_heart_empty.png" alt="not on list" class="icon-small" />
	icon on any of the events below.
</EventsList>

<fieldset class="settings">
	<legend>Reminder settings</legend>
	<input type="range" name="vol" min="0" max="10" step="1" bind:value={inAdvance} />
	{#if inAdvance}
		<p>Notify me {inAdvance} minutes before the event</p>
	{:else}
		<p>Notify me when the event starts</p>
	{/if}
	<div class="group">
		<h4>Alarm sound</h4>
		{#each ['trumpet', 'squeeze', 'notif3', 'notif9'] as name}
			<label>
				<input type="radio" name="sounds" value={name} bind:group={sound} />
				{name}
			</label>
		{/each}
	</div>
	<button on:click={() => playAlarm()}>test alarm ({sound})</button>
</fieldset>


<!-- <pre>{JSON.stringify($remindersStore, null, 4)}</pre> -->

<h2>Available:</h2>
<section>
	<SearchInput bind:value={filter} name="filter" id="filter" placeholder="list too long?" />
</section>

{#each Object.keys(events) as cat}
	{@const notWatched = getNotWatched(events[cat], filter, version)}
	{#if notWatched}
		<EventsCategory events={notWatched} {showChatLinks} category={cat} on:toggle-watched={hndToggleWatched} />
	{/if}
{/each}

<style lang="scss">
	h2 {
		margin-top: 1em;
	}
</style>
