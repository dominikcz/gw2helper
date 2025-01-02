<script>
	import eventsUtils from './eventsUtils';

    /** @type {{dt0: any}} */
    let { dt0 } = $props();
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
