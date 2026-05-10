<script lang="ts">
	import Item from '$lib/components/items/item.svelte';
	import helperUtils from '$lib/utils/helper-utils';
	import Awaiter from '$lib/components/ui/awaiter.svelte';
	import { autotooltip } from '$lib/actions/autotooltip';
	import { itemTooltipRenderer } from './itemTooltipRenderer';
	import { t as _ } from '$lib/services/i18n';
	import { grungeBorder } from '$lib/actions/grungeBorder';

	type ItemListEntry = {
		id: number;
		name?: string;
		icon?: string;
		description?: string;
		type?: string;
		subtype?: string;
		subdescr?: string;
		rarity?: string;
		count: number;
		locked?: boolean;
		flags?: string[];
	};

	export let summary: string;
	export let items: Promise<ItemListEntry[]> | ItemListEntry[];
	export let filter: string = '';
	export let useBorder: boolean = true;
	export let additionalInfo: string = '';
	export let filterFlags: boolean = false;
	export let error: string = '';

	const fields_def = ['name', 'description', 'type', 'subtype', 'subdescr', 'rarity', 'count'];

	const tooltipOptions = {
		customRenderers: {
			'img.item': itemTooltipRenderer,
		},
	};

	function filterColletion(collection: ItemListEntry[], filter: string, filterFlags: boolean): ItemListEntry[] {
		const fields = [...fields_def];
		if (filterFlags) {
			fields.push('flags');
		}
		return helperUtils.filterCollection(collection, fields, filter, { nonZero: true, nonZeroField: 'count' }) as ItemListEntry[];
	}
</script>

<details class="searchable" open use:grungeBorder={{ grunge: useBorder }}>
	<summary>{summary}</summary>
	<article>
		{#if error}
			<div class="items">
				<span class="no-results">{error}</span>
			</div>
		{:else}
		<Awaiter promise={items}>
			{#snippet children(result: ItemListEntry[])}
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
		{/if}
	</article>
</details>

<style>
	.additional-info {
		width: 100%;
		margin-bottom: 1rem;
	}
</style>

