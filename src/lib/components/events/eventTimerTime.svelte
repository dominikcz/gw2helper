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

<style lang="scss">
	.event-bar {
		position: relative;
		display: flex;
		flex-flow: row nowrap;
		min-height: 3em;
		min-width: 75em;
		margin-bottom: 0.3125em;
		color: #222;
		&.compact {
			min-height: auto;
			height: 1.6em;
		}
		&.time {
			position: sticky;
			top: 0;
			background-color: var(--gw2helper-module-white);
			z-index: 1;
			.event {
				border-left: 1px solid var(--gw2helper-module-dark);
				color: var(--gw2helper-module-text);
			}
		}
	}

</style>