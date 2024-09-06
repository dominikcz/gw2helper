<script lang="ts">
	import Item from '$lib/components/item.svelte';
	import helperUtils from '$lib/utils/helper-utils';
	import Awaiter from './awaiter.svelte';
	import { autotooltip } from '$lib/actions/autotooltip';

	export let summary: string;
	export let items;
	export let filter: string = '';
	const fields = ['name', 'description', 'type', 'subtype', 'subdescr', 'rarity'];
</script>

<details class="searchable" open>
	<summary>{summary}</summary>
	<article>
		<Awaiter promise={items} let:result>
			<div class="items autotooltip" use:autotooltip>
				{#each helperUtils.filterCollection(result, fields, filter, { nonZero: true, nonZeroField: 'count' }) as item, index (`${item.id}-${index}`)}
					<Item {item} />
				{:else}
					<slot name="no-results">
						<span class="no-results">...nothing found</span>
					</slot>
				{/each}
			</div>
		</Awaiter>
	</article>
</details>
