<script>
	import EventTimers from '$lib/components/eventTimers.svelte';
	import { eventData } from './metas';
	import utils from '$lib/utils';
	import { onMount } from 'svelte';

	let showChatLinks = runsDesktop();
	let showEventTimes = false
	let showCategories = true;
	let showHeadings = true;
	let autoScroll = false;
	let excludedSpecialEvents = [/*'lc',*/ 'db', 'ha'];
	// remove special events
	excludedSpecialEvents.forEach(x => delete eventData[x]);

	function runsDesktop(){
		const browser = window.navigator.userAgent||window.opera;
		const desktop = ['Windows', 'Linux', 'Macintosh'].some(v => browser.includes(v));
		console.log('browser', {browser, desktop});
		return desktop;
	}

	onMount(async () =>{
		const settings = await utils.readEventTimerSettings();
		if (settings.showChatLinks !== undefined) showChatLinks = settings.showChatLinks;
		if (settings.showEventTimes !== undefined) showEventTimes = settings.showEventTimes;
		if (settings.showCategories !== undefined) showCategories = settings.showCategories;
		if (settings.showHeadings !== undefined) showHeadings = settings.showHeadings;
		if (settings.autoScroll !== undefined) autoScroll = settings.autoScroll;
	})
	
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

<EventTimers wikiData={eventData} updateInterval={30} {showChatLinks} {showEventTimes} {showCategories} {showHeadings} {autoScroll} />

