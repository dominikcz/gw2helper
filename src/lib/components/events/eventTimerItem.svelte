<script>
	import helperUtils from '$lib/utils/helper-utils';
	import eventsUtils from './eventsUtils';
	import { t as _ } from '$lib/services/i18n';

	export let event;
	export let showEventTimes = true;
	export let showChatLinks = true;
	export let darkMode = false;
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
				<a href={helperUtils.wikiLink(segment.link)} target="_blank" title={`${segment.name} - ${$_('common.read_more_on_wiki')}`}>{segment.name}</a>
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
    .event-time {
        font-size: 80%; 
        &.no-event{
            color: rgba(255, 255, 255, 0.5);
        }
        &.chatlink{
            font-size: 80%;
        }
    }
</style>