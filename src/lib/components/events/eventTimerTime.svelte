<script>
	import eventsUtils from './eventsUtils';

    export let dt0;
</script>

<div class="event-bar compact time">
    {#each eventsUtils.getTimeSegments(dt0) as segment}
        <div class="event" title={segment.name} style="width: {(segment.duration * 100) / 120}%;">
            {#if segment.name}
                <span>{segment.name}</span>
            {/if}
        </div>
    {/each}
</div>
