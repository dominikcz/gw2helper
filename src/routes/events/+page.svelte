<script>
	import EventTimers from '$lib/components/eventTimers.svelte';
	import { eventData } from './metas';
	import utils from '$lib/utils';

	const settings = utils.readEventTimerSettings();

	let showChatLinks = settings.showChatLinks == undefined ? true : settings.showChatLinks;
	let showEventTimes = settings.showEventTimes == undefined ? true : settings.showEventTimes;
	let showCategories = settings.showCategories == undefined ? true : settings.showCategories;
	let showHeadings = settings.showHeadings == undefined ? true : settings.showHeadings;
	let autoScroll = settings.autoScroll == undefined ? false : settings.autoScroll;

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

<EventTimers wikiData={eventData} updateInterval={30} {showChatLinks} {showEventTimes} {showCategories} {showHeadings} {autoScroll}/>

