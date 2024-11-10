<script lang="ts">
	import Item from '$lib/components/items/item.svelte';
	import helperUtils from '$lib/utils/helper-utils';
	import Awaiter from '$lib/components/awaiter.svelte';
	import { autotooltip } from '$lib/actions/autotooltip';
	import { itemTooltipRenderer } from './itemTooltipRenderer';
	import { t as _ } from '$lib/services/i18n.js';

	export let summary: string;
	export let items;
	export let filter: string = '';
	const fields = ['name', 'description', 'type', 'subtype', 'subdescr', 'rarity'];

	const tooltipOptions = {
		customRenderers: {
			'img.item': itemTooltipRenderer,
		},
	};

</script>

<details class="searchable masked" open style="mask-position: {Math.trunc(Math.random() * 1000)}px bottom;">
	<summary>{summary}</summary>
	<article>
		<Awaiter promise={items} let:result>
			<div class="items autotooltip autotooltip-sticky" use:autotooltip={tooltipOptions} >
				{#each helperUtils.filterCollection(result, fields, filter, { nonZero: true, nonZeroField: 'count' }) as item, index (`${item.id}-${index}`)}
					<Item {item} />
				{:else}
					<slot name="no-results">
						<span class="no-results">{$_('common.nothing_found')}</span>
					</slot>
				{/each}
			</div>
		</Awaiter>
	</article>
</details>
