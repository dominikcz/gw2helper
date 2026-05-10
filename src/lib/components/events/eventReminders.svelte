<script lang="ts">
	import { asset } from '$app/paths';
	import EventsList from './eventsList.svelte';
	import SearchInput from '../searchInput.svelte';
	import helperUtils from '$lib/utils/helper-utils';
	import EventsCategory from './eventsCategory.svelte';
	import eventsUtils from './eventsUtils';
	import Clock from '$lib/services/clock.svelte';
	import Reminders from '$lib/reminders';
	import utils from '$lib/utils';
	import { t as _ } from '$lib/services/i18n';

	type ReminderEvent = {
		name: string;
		startTimes: string[];
		next?: string;
		watched?: boolean;
		alarms?: string[];
		bg?: string;
		link?: string;
		chatlink?: string;
	};

	interface ReminderTogglePayload {
		name: string;
		watched: boolean;
	}

	interface ReminderAlarmPayload {
		name: string;
		alarms: string[];
	}

	/** @type {{events: Record<string, ReminderEvent[]>, showChatLinks?: boolean, updateInterval?: number, inAdvance?: number, sound?: string, sortBy?: 'time' | 'name'}} */
	let {
		events = $bindable(),
		showChatLinks = false,
		updateInterval = 60,
		inAdvance = $bindable(5),
		sound = $bindable('trumpet'),
		sortBy = $bindable('time'),
	} = $props();

	let filter = $state('');

	// svelte-ignore state_referenced_locally
	let time = new Clock({ interval: updateInterval * 1000 });
	let reminders = new Reminders();

	const remindersStore = reminders.$store;

	let version = $state(0);

	function hndAlarmsChange(event: ReminderAlarmPayload) {
		reminders.updateAlarms(event.name, event.alarms);
	}

	function getWatched(_ver: number): ReminderEvent[] {
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

		const _watched: ReminderEvent[] = [];
		const alarms = reminders.getAllAlarms() as Record<string, string[]>;
		const allObserved = Object.keys(alarms);
		const filteredEvents = Object.values(events).flat() as ReminderEvent[];

		allObserved.forEach((ev: string) => {
			const hours = alarms[ev];
			const found = filteredEvents.find((x: ReminderEvent) => x.name == ev);
			_watched.push({
				...(found || { name: ev, startTimes: hours }),
				alarms: [...(hours || [])],
				watched: true,
			});
		});

		return sort(_watched, 'name');
	}

	function sort(collection: ReminderEvent[], sortBy: 'time' | 'name') {
		if (sortBy == 'name') {
			collection.sort((a: ReminderEvent, b: ReminderEvent) => a.name.localeCompare(b.name));
		} else {
			collection.sort((a: ReminderEvent, b: ReminderEvent) => (a.next ?? '').localeCompare(b.next ?? ''));
		}
		return collection;
	}

	function getNotWatched(events: ReminderEvent[], filter: string, sortBy: 'time' | 'name', _ver: number) {
		const notWatched = events.filter((x: ReminderEvent) => !x.watched);
		return sort(helperUtils.filterCollection(notWatched, ['name'], filter) as ReminderEvent[], sortBy);
	}

	function getEvent(name: string): ReminderEvent | undefined {
		let _event: ReminderEvent | undefined;
		Object.keys(events).some((cat) => {
			_event = events[cat].find((x: ReminderEvent) => x.name == name);
			return _event !== undefined;
		});
		return _event;
	}

	function updateNextEvents() {
		Object.keys(events).forEach((catKey: string) => {
			const cat = events[catKey];
			let changed = false;
			cat.forEach((event: ReminderEvent) => {
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

	async function hndToggleWatched(event: ReminderTogglePayload) {
		const _event = getEvent(event.name);
		if (!_event) {
			return;
		}
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
		window.dispatchEvent(
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
		image: `<img src="${asset('/assets/rewards/map_heart_empty.png')}" alt="not on list" class="icon-small" />`,
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
	{@const notWatched = getNotWatched(events[cat], filter, sortBy as 'time' | 'name', version)}
	{#if notWatched}
		<EventsCategory events={notWatched} {showChatLinks} category={cat} onToggleWatched={hndToggleWatched} />
	{/if}
{/each}

<style lang="scss">
	h2 {
		margin-top: 1em;
	}

	.settings {
		display: grid;
		gap: 0.8rem;
		padding: 0.85rem 1rem 1rem;
		width: min(100%, 52rem);

		.group {
			display: flex;
			align-items: flex-start;
			flex-wrap: wrap;
			column-gap: 0.9rem;
			row-gap: 0.35rem;
		}

		.group + .group {
			margin-top: 0.5rem;
		}

		h4 {
			margin: 0;
			flex-basis: 100%;
			margin-bottom: 0.1rem;
		}

		label {
			display: inline-flex;
			align-items: center;
			gap: 0.45rem;
			margin-right: 0.9rem;
			margin-bottom: 0.2rem;
		}

		button + button {
			margin-left: 0.5rem;
		}

		button {
			justify-self: start;
			width: auto;
		}
	}
</style>
