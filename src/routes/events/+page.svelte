<script lang="ts">
	import EventTimers from '$lib/components/events/eventTimers.svelte';
	import EventReminders from '$lib/components/events/eventReminders.svelte';
	import utils from '$lib/utils';
	import { onMount } from 'svelte';
	import Tabs from '$lib/components/tabs/tabs.svelte';
	import Tab from '$lib/components/tabs/tab.svelte';
	import { TabPanel } from '$lib/components/tabs/tabs';
	import eventsUtils from '$lib/components/events/eventsUtils';
	import { t as _ } from '$lib/services/i18n.js';

	/** @type {{data: any}} */
	let { data = $bindable() } = $props();
	let { remindersSettings } = $state(data);
	$effect(() => {
		remindersSettings = data.remindersSettings;
	});

	let showChatLinks = $state(false); // utils.runsDesktop()
	let showEventTimes = $state(true);
	let showCategories = $state(true);
	let showHeadings = $state(true);
	let autoScroll = $state(!utils.runsDesktop());

	let allEvents = $state([]); // here we hold all events' data

	onMount(async () => {
		const currentSeason = data.apiService.currentSeason();
		const specialEvents = [
			'lc', // Labyrinthine Cliffs
			'db', // Day and night
			'ha', // Halloween
		].filter((season) => season !== currentSeason);
		console.log('Current season:', currentSeason);
		// remove all special events but currentSeason
		eventsUtils.excludeEvents(specialEvents);
		eventsUtils.init();

		allEvents = eventsUtils.prepareDailyCalendar();
		const settings = await utils.readEventTimerSettings();
		if (settings.showChatLinks !== undefined) showChatLinks = settings.showChatLinks;
		if (settings.showEventTimes !== undefined) showEventTimes = settings.showEventTimes;
		if (settings.showCategories !== undefined) showCategories = settings.showCategories;
		if (settings.showHeadings !== undefined) showHeadings = settings.showHeadings;
		if (settings.autoScroll !== undefined) autoScroll = settings.autoScroll;
	});

	function saveSettings() {
		utils.saveEventTimerSettings({
			showChatLinks,
			showEventTimes,
			showCategories,
			showHeadings,
			autoScroll,
		});
	}
</script>

<h1>{$_('events.events')}</h1>
<Tabs>
	<div class="tab-list">
		<Tab>{$_('events.event_timers')}</Tab>
		<Tab>{$_('events.reminders')}</Tab>
	</div>

	<TabPanel>
		<EventTimers updateInterval={5} {showChatLinks} {showEventTimes} {showCategories} {showHeadings} {autoScroll} />
		<fieldset class="settings">
			<legend>{$_('common.settings')}</legend>

			<label><input type="checkbox" id="chat-links" bind:checked={showChatLinks} /> {$_('events.show_chat_links')}</label>
			<label><input type="checkbox" id="event-times" bind:checked={showEventTimes} /> {$_('events.show_event_times')}</label>
			<label><input type="checkbox" id="categories" bind:checked={showCategories} /> {$_('events.show_categories')}</label>
			<label><input type="checkbox" id="headings" bind:checked={showHeadings} /> {$_('events.show_headings')}</label>
			<label><input type="checkbox" id="auto-scroll" bind:checked={autoScroll} /> {$_('events.auto_scroll')}</label>
			<button onclick={saveSettings}>{$_('common.save_settings')}</button>
		</fieldset>
	</TabPanel>

	<TabPanel>
		<EventReminders
			events={allEvents}
			{showChatLinks}
			bind:inAdvance={remindersSettings.inAdvance}
			bind:sound={remindersSettings.sound}
			bind:sortBy={remindersSettings.sortBy}
		/>
	</TabPanel>
</Tabs>
