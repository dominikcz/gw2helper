<script>
	import { base } from '$app/paths';
	import EventsList from './eventsList.svelte';
	import SearchInput from '../searchInput.svelte';
	import helperUtils from '$lib/utils/helper-utils';
	import EventsCategory from './eventsCategory.svelte';
	import eventsUtils from './eventsUtils';
	import Clock from '$lib/services/clock.svelte';
	import Reminders from '$lib/reminders';
	import utils from '$lib/utils';
	import { t as _ } from '$lib/services/i18n.js';

	/** @type {{events: any, showChatLinks?: boolean, updateInterval?: number, inAdvance?: number, sound?: string, sortBy?: 'time' | 'name'}} */
	let {
		events = $bindable(),
		showChatLinks = false,
		updateInterval = 60,
		inAdvance = $bindable(5),
		sound = $bindable('trumpet'),
		sortBy = $bindable('time'),
	} = $props();

	let filter = $state('');

	let time = new Clock({ interval: updateInterval * 1000 });
	let reminders = new Reminders();

	const remindersStore = reminders.$store;

	let version = $state(0);

	function hndAlarmsChange(event) {
		reminders.updateAlarms(event.name, event.alarms);
	}

	function getWatched(ver) {
		// const _watched = [];
		// Object.keys(events).forEach((cat) => {
		// 	events[cat].forEach((x) => {
		// 		const hours = reminders.getAlarms(x.name);
		// 		if (x.watched || hours != undefined) {
		// 			x.watched = true;
		// 			x.alarms = [...(hours || [])];
		// 			_watched.push(x);
		// 		}
		// 	});
		// });
		// return _watched;

		const _watched = [];
		const alarms = reminders.getAllAlarms();
		const allObserved = Object.keys(alarms);
		const filteredEvents = Object.values(events).flat();

		allObserved.forEach((ev) => {
			const hours = alarms[ev];
			const found = filteredEvents.find((x) => x.name == ev) || { name: ev, startTimes: hours };
			found.alarms = [...(hours || [])];
			found.watched = true;
			_watched.push(found);
		});

		return sort(_watched, 'name');
	}

	function sort(collection, sortBy) {
		if (sortBy == 'name') {
			collection.sort((a, b) => a.name.localeCompare(b.name));
		} else {
			collection.sort((a, b) => a.next.localeCompare(b.next));
		}
		return collection;
	}

	function getNotWatched(events, filter, sortBy, ver) {
		const notWatched = events.filter((x) => !x.watched);
		return sort(helperUtils.filterCollection(notWatched, ['name'], filter), sortBy);
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
				const newNext = eventsUtils.getNextOccurence(event.startTimes, time.value);
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
		const _event = getEvent(event.name);
		if (event.watched) {
			_event.alarms = [];
			_event.watched = true;
			reminders.addEvent(event.name);
		} else {
			if (_event) {
				_event.watched = false;
			}
			reminders.deleteEvent(event.name);
		}
		version++;
	}

	async function saveSettings() {
		await utils.saveRemindersSettings({ inAdvance, sound, sortBy });
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
	$effect(() => {
		onTimeChange();
	});
</script>

<h2>{$_('events.watched.watched')}</h2>
<EventsList events={getWatched(version)} onToggleWatched={hndToggleWatched} onAlarmsChange={hndAlarmsChange}>
	{@html $_('events.watched.empty_list', {
		image: `<img src="${base}/assets/rewards/map_heart_empty.png" alt="not on list" class="icon-small" />`,
	})}
</EventsList>

<fieldset class="settings">
	<legend>{$_('events.watched.reminder_settings')}</legend>
	<input type="range" name="vol" min="0" max="10" step="1" bind:value={inAdvance} />
	<p>{$_('events.watched.notify_me', { inAdvance })}</p>
	<div class="group">
		<h4>{$_('events.watched.alarm_sound')}</h4>
		{#each ['trumpet', 'squeeze', 'notif3', 'notif9'] as name}
			<label>
				<input type="radio" name="sounds" value={name} bind:group={sound} />
				{name}
			</label>
		{/each}
	</div>
	<div class="group">
		<h4>{$_('events.sort_by.sort')}</h4>
		<label><input type="radio" name="sort" value="time" bind:group={sortBy} /> {$_('events.sort_by.time')}</label>
		<label><input type="radio" name="sort" value="name" bind:group={sortBy} /> {$_('events.sort_by.name')}</label>
	</div>
	<button onclick={() => testAlarm()}>{$_('events.watched.test_alarm', { sound })}</button>
	<button onclick={saveSettings}>{$_('common.save')}</button>
</fieldset>

<h2>{$_('events.available')}</h2>

<section>
	<SearchInput bind:value={filter} name="filter" id="filter" placeholder={$_('common.list_too_long')} />
</section>

{#each Object.keys(events) as cat}
	{@const notWatched = getNotWatched(events[cat], filter, sortBy, version)}
	{#if notWatched}
		<EventsCategory events={notWatched} {showChatLinks} category={cat} onToggleWatched={hndToggleWatched} />
	{/if}
{/each}

<style lang="scss">
	h2 {
		margin-top: 1em;
	}
</style>
