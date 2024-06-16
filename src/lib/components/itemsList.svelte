<script>
	import Item from '$lib/components/item.svelte';
    export let summary;
    export let items;
</script>

<details class="searchable" open>
	<summary>{summary}</summary>
	<article>
		<div class="items">
			{#each items as item}
				<Item {item} />
			{:else}
                <slot name="no-results">
                    <span class="no-results">...nothing found</span>
                </slot>
			{/each}
		</div>
	</article>
</details>