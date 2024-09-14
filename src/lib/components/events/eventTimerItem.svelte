<script>
	import helperUtils from '$lib/utils/helper-utils';
	import eventsUtils from './eventsUtils';

    export let event;
	export let showEventTimes = true;
	export let showChatLinks = true;
    export let darkMode = false;
</script>

<div class="event-bar">
    {#each Object.values(event.segments) as segment}
        <div class="event" class:real={segment.name} title={segment.name} style="width: {(segment.duration * 100) / 120}%; background: {eventsUtils.getColor(segment.bg, darkMode)};">
            {#if segment.name}
                <a href={helperUtils.wikiLink(segment.link)} target="_blank" title={`${segment.name} - read more on Wiki`} >{segment.name}</a>
                {#if showChatLinks && segment.chatlink}
                    <span class="chatlink">{segment.chatlink}</span>
                {/if}
                {#if showEventTimes}
                    <span>{`${eventsUtils.getHour(segment.start)} - ${eventsUtils.getHour(segment.stop)}`}</span>
                {/if}
            {/if}
        </div>
    {/each}
</div>
