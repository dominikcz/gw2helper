<script>
	import { base } from '$app/paths';
	import EventsList from './eventsList.svelte';
	import SearchInput from '../searchInput.svelte';
	import helperUtils from '$lib/utils/helper-utils';
	import EventsCategory from './eventsCategory.svelte';
	import eventsUtils from './eventsUtils';
	import clock from '$lib/stores/clock';
	import Reminders from '$lib/reminders';
	import utils from '$lib/utils';
	import { _ } from 'svelte-i18n';

	export let events;
	export let showChatLinks = false;
	export let updateInterval = 60;

	export let inAdvance = 5;
	export let sound = 'trumpet';

	let filter = '';

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

	async function saveNotifySettings() {
		await utils.saveRemindersSettings({ inAdvance, sound });
	}

	function testAlarm() {
		dispatchEvent(
			new CustomEvent('notification-test', {
				bubbles: true,
				detail: {
					sound,
				},
			})
		);
	}
</script>

<h2>{$_('events.watched.watched')}</h2>
<EventsList events={getWatched(version)} on:toggle-watched={hndToggleWatched} on:alarms-change={hndAlarmsChange}>
	{@html $_('events.watched.empty_list', { values: { img_url: `${base}/assets/rewards/map_heart_empty.png` } })}
</EventsList>

<fieldset class="settings">
	<legend>{$_('events.watched.reminder_settings')}</legend>
	<input type="range" name="vol" min="0" max="10" step="1" bind:value={inAdvance} />
	<p>{$_('events.watched.notify_me', {values: {inAdvance}})}</p>
	<div class="group">
		<h4>{$_('events.watched.alarm_sound')}</h4>
		{#each ['trumpet', 'squeeze', 'notif3', 'notif9'] as name}
			<label>
				<input type="radio" name="sounds" value={name} bind:group={sound} />
				{name}
			</label>
		{/each}
	</div>
	<button on:click={() => testAlarm()}>{$_('events.watched.test_alarm', { values: { sound } })}</button>
	<button on:click={saveNotifySettings}>save</button>
</fieldset>

<h2>{$_('events.available')}</h2>
<section>
	<SearchInput bind:value={filter} name="filter" id="filter" placeholder={$_('common.list_too_long')} />
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
