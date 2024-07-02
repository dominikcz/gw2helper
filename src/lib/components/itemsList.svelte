<script lang="ts">
	import Item from '$lib/components/item.svelte';
	import helperUtils from '$lib/utils/helper-utils';
	import Spinner from '$lib/components/gw2spinner.svelte';
	import { invalidateAll } from '$app/navigation';

    export let summary: string;
    export let items;
	export let filter: string = '';
	const fields = ['name', 'description', 'type', 'subtype', 'subdescr', 'rarity'];
</script>

<details class="searchable" open>
	<summary>{summary}</summary>
	<article>
		<div class="items">

			{#await items}
				<Spinner />
			{:then items}
			{#each helperUtils.filterCollection(items, fields, filter, true, 'count') as item}
				<Item {item} />
			{:else}
                <slot name="no-results">
                    <span class="no-results">...nothing found</span>
                </slot>
			{/each}
			{:catch error}
				<p>error loading data: {error.message}</p>
				<button on:click={invalidateAll()}>retry</button>
			{/await}

		</div>
	</article>
</details>