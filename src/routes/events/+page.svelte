<script>
	import EventTimers from '$lib/components/wizardsVault/events/eventTimers.svelte';
	import EventReminders from '$lib/components/wizardsVault/events/eventReminders.svelte';
	import { eventData } from './metas';
	import utils from '$lib/utils';
	import { onMount } from 'svelte';
	import Tabs from '$lib/components/tabs/tabs.svelte';
	import Tab from '$lib/components/tabs/tab.svelte';
	import { TabPanel } from '$lib/components/tabs/tabs';

	let showChatLinks = runsDesktop();
	let showEventTimes = false;
	let showCategories = true;
	let showHeadings = true;
	let autoScroll = false;
	let excludedSpecialEvents = ['lc', 'db', 'ha'];
	// remove special events
	excludedSpecialEvents.forEach((x) => delete eventData[x]);
	let allEvents = [];
	let watchedEvents = [];

	function runsDesktop() {
		const browser = window.navigator.userAgent || window.opera;
		const desktop = ['Windows', 'Linux', 'Macintosh'].some((v) => browser.includes(v));
		console.log('desktop', desktop);
		return desktop;
	}

	function prepareAllEvents() {
		allEvents = [];
		const ignored = ['t', 'dn'];
		Object.keys(eventData).forEach((catKey) => {
			if (!ignored.includes(catKey)) {
				const cat = eventData[catKey];
				const segments = Object.keys(cat.segments);
				segments.forEach((x) => {
					const ev = cat.segments[x];
					if (ev.name) {
						allEvents.push({
							category: cat.category,
							heading: cat.name,
							name: ev.name,
						});
					}
				});
			}
		});
	}

	onMount(async () => {
		const settings = await utils.readEventTimerSettings();
		if (settings.showChatLinks !== undefined) showChatLinks = settings.showChatLinks;
		if (settings.showEventTimes !== undefined) showEventTimes = settings.showEventTimes;
		if (settings.showCategories !== undefined) showCategories = settings.showCategories;
		if (settings.showHeadings !== undefined) showHeadings = settings.showHeadings;
		if (settings.autoScroll !== undefined) autoScroll = settings.autoScroll;
		prepareAllEvents();
	});

	async function hndToggleWatched(event) {
		const obj = event.detail;
		if (obj.watched) {
			watchedEvents.push(obj.name);
			watchedEvents = watchedEvents;
		} else {
			watchedEvents = watchedEvents.filter((x) => x !== obj.name);
		}
		await utils.saveWatchedEvents(watchedEvents);
	}

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
		<EventTimers wikiData={eventData} updateInterval={30} {showChatLinks} {showEventTimes} {showCategories} {showHeadings} {autoScroll} />
	</TabPanel>

	<TabPanel>
		<EventReminders events={allEvents} watched={watchedEvents} on:toggle-watched={hndToggleWatched}/>
	</TabPanel>
</Tabs>
