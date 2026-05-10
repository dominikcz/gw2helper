<script lang="ts">
	import helperUtils from '$lib/utils/helper-utils';
	import eventsUtils from './eventsUtils';
	import { t as _ } from '$lib/services/i18n';
	import WatchState from '../watch-state/watch-state.svelte';
	import Reminders from '$lib/reminders';

	type EventSegment = {
		start: Date;
		duration: number;
		bg: string;
		name: string;
		link: string;
		chatlink?: string;
	};

	type TimerEvent = {
		segments: Record<string, EventSegment>;
	};

	interface Props {
		event: TimerEvent;
		showEventTimes?: boolean;
		showChatLinks?: boolean;
		darkMode?: boolean;
	}

	let { event, showEventTimes = true, showChatLinks = false, darkMode = false } = $props();

	let reminders = new Reminders();

	const remindersStore = reminders.$store;
	const segments = $derived(Object.values(event.segments) as EventSegment[]);

	function toggleSegmentWatched(segment: EventSegment) {
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
	{#each segments as segment}
	{@const _watched = reminders.isWatched($remindersStore, segment)}
	{@const _title = `${$_(_watched ? 'events.click_to_remove' : 'events.click_to_add')} - ${segment.name}`}
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
					<WatchState title={_title} watched={_watched} onClick={() => toggleSegmentWatched(segment)} />
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
	.event-bar {
		position: relative;
		display: flex;
		flex-flow: row nowrap;
		min-height: 3em;
		min-width: 75em;
		margin-bottom: 0.3125em;
		color: #222;
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
	.event {
		display: flex;
		flex-flow: column nowrap;
		padding: 0.3125em;
		// word-break: break-all;
		overflow-wrap: break-word;

		// height: 4em;
		// overflow: hidden;
		// text-overflow: clip;

		&.real {
			border-left: 1px solid rgba(255, 255, 255, 0.3);
		}
		a {
			color: var(--gw2helper-link-color);
		}
	}
</style>
