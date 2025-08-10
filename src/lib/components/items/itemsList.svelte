<script lang="ts">
	import Item from '$lib/components/items/item.svelte';
	import helperUtils from '$lib/utils/helper-utils';
	import Awaiter from '$lib/components/awaiter.svelte';
	import { autotooltip } from '$lib/actions/autotooltip';
	import { itemTooltipRenderer } from './itemTooltipRenderer';
	import { t as _ } from '$lib/services/i18n.js';
	import { grungeBorder } from '$lib/actions/grungeBorder';

	export let summary: string;
	export let items;
	export let filter: string = '';
	export let useBorder: boolean = true;
	export let additionalInfo: string = '';
	export let filterFlags: boolean = false;

	const fields_def = ['name', 'description', 'type', 'subtype', 'subdescr', 'rarity', 'count'];

	const tooltipOptions = {
		customRenderers: {
			'img.item': itemTooltipRenderer,
		},
	};

	function filterColletion(collection, filter, filterFlags) {
		const fields = [...fields_def];
		if (filterFlags) {
			fields.push('flags');
		}
		return helperUtils.filterCollection(collection, fields, filter, { nonZero: true, nonZeroField: 'count' });
	}
</script>

<details class="searchable" open use:grungeBorder={{ grunge: useBorder }}>
	<summary>{summary}</summary>
	<article>
		<Awaiter promise={items}>
			{#snippet children(result)}
				<div class="items autotooltip autotooltip-sticky" use:autotooltip={tooltipOptions}>
					{#if additionalInfo}
						<span class="additional-info">{additionalInfo}</span>
					{/if}
					{#each filterColletion(result, filter, filterFlags) as item, index (`${item.id}-${index}`)}
						<Item {item} />
					{:else}
						<slot name="no-results">
							<span class="no-results">{$_('common.nothing_found')}</span>
						</slot>
					{/each}
				</div>
			{/snippet}
		</Awaiter>
	</article>
</details>

<style>
	.additional-info {
		width: 100%;
		margin-bottom: 1rem;
	}
</style>
