<script>
	import helperUtils from '$lib/utils/helper-utils';
	import eventsUtils from './eventsUtils';
	import { t as _ } from '$lib/services/i18n';
	import WatchState from '../watch-state/watch-state.svelte';
	import Reminders from '$lib/reminders';

	/** @type {{event: any, showEventTimes?: boolean, showChatLinks?: boolean, darkMode?: boolean}} */
	let { event, showEventTimes = true, showChatLinks = false, darkMode = false } = $props();

	let reminders = new Reminders();

	const remindersStore = reminders.$store;

	function toggleSegmentWatched(segment) {
		console.log('toggleSegmentWatched', segment);
		const hour = eventsUtils.getHour(segment.start);
		let alarms = [];
		if (reminders.hasEvent(segment.name)) {
			alarms = reminders.getAlarms(segment.name);
			const idx = alarms.indexOf(hour);
			if (idx >= 0) {
				alarms.splice(idx, 1);
			} else {
				alarms.push(hour);
			}
		} else {
			reminders.addEvent(segment.name);
			alarms.push(hour);
		}

		if (alarms.length > 0) reminders.updateAlarms(segment.name, alarms);
		else reminders.deleteEvent(segment.name);
	}
</script>

<div class="event-bar">
	{#each Object.values(event.segments) as segment}
		<div
			class="event"
			class:real={segment.name}
			title={segment.name}
			style="width: {(segment.duration * 100) / 120}%; background: {eventsUtils.getColor(segment.bg, darkMode)};"
		>
			{#if segment.name}
				<div class="header">
					<a href={helperUtils.wikiLink(segment.link)} target="_blank" title={`${segment.name} - ${$_('common.read_more_on_wiki')}`}>{segment.name}</a
					>
					<WatchState title={segment.name} watched={reminders.isWatched($remindersStore, segment)} onClick={() => toggleSegmentWatched(segment)} />
				</div>
				{#if showChatLinks && segment.chatlink}
					<span class="chatlink">{segment.chatlink}</span>
				{/if}
			{/if}
			{#if showEventTimes}
				<span class="event-time {segment.name ? '' : 'no-event'}">{`${eventsUtils.getHour(segment.start)}`}</span>
			{/if}
		</div>
	{/each}
</div>

<style lang="scss">
	.header {
		display: flex;
		flex-flow: row wrap;
		justify-content: space-between;
		align-items: center;
	}

	.event-time {
		font-size: 80%;
		&.no-event {
			color: rgba(255, 255, 255, 0.5);
		}
	}
	.chatlink {
		font-size: 80%;
	}
</style>
