<script>
	import EventTimers from '$lib/components/events/eventTimers.svelte';
	import EventReminders from '$lib/components/events/eventReminders.svelte';
	import utils from '$lib/utils';
	import { onMount } from 'svelte';
	import Tabs from '$lib/components/tabs/tabs.svelte';
	import Tab from '$lib/components/tabs/tab.svelte';
	import { TabPanel } from '$lib/components/tabs/tabs';
	import eventsUtils from '$lib/components/events/eventsUtils';

	let showChatLinks = utils.runsDesktop();
	let showEventTimes = false;
	let showCategories = true;
	let showHeadings = true;
	let autoScroll = false;

	let allEvents = [];  // here we hold all events' data

	onMount(async () => {
		// remove special events
		eventsUtils.excludeEvents(['lc', 'db', 'ha']);
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

<img src="/gw2helper/assets/150px-construction.png" title="Under constrution" width="150px" alt="under construction" />

<fieldset class="settings">
	<legend>Settings</legend>

	<label><input type="checkbox" id="chat-links" bind:checked={showChatLinks} /> Show chat links</label>
	<label><input type="checkbox" id="event-times" bind:checked={showEventTimes} /> Show event times</label>
	<label><input type="checkbox" id="categories" bind:checked={showCategories} /> Show categories</label>
	<label><input type="checkbox" id="headings" bind:checked={showHeadings} /> Show headings</label>
	<label><input type="checkbox" id="auto-scroll" bind:checked={autoScroll} /> Auto scroll</label>
	<button on:click={saveSettings}>Save settings</button>
</fieldset>

<Tabs>
	<div class="tab-list">
		<Tab>Event timers</Tab>
		<Tab>Reminders</Tab>
	</div>

	<TabPanel>
		<EventTimers updateInterval={15} {showChatLinks} {showEventTimes} {showCategories} {showHeadings} {autoScroll} />
	</TabPanel>

	<TabPanel>
		<EventReminders events={allEvents} {showChatLinks} />
	</TabPanel>
</Tabs>
