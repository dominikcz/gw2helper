<script>
	export let items;
	import wxdates from '$lib/wxjs_dates.ts';
	import Item from '$lib/components/items/item.svelte';
	import Price from '$lib/components/price.svelte';
	import { autotooltip } from '$lib/actions/autotooltip';
	import { itemTooltipRenderer } from '$lib/components/items/itemTooltipRenderer';
	import { t as _ } from '$lib/services/i18n.js';

	const tooltipOptions = {
		customRenderers: {
			'img.item': itemTooltipRenderer,
		},
	};
</script>

<div class="transaction-list autotooltip autotooltip-sticky" use:autotooltip={tooltipOptions}>
	{#each items as item, index (`${item.id}-${index}`)}
		<div class="transaction">
			<Item {item} />
			<span class="item-name">{item.name}</span>
			<Price value={item.price} />
			<span>{wxdates.friendlyDurationTillNow(new Date(item.created))}</span>
		</div>
	{:else}
		<slot name="no-results">
			<span class="no-results">{$_('common.nothing_found')}</span>
		</slot>
	{/each}
</div>

<style lang="scss">
    .transaction-list {
        display: flex;
        flex-flow: column nowrap;
        row-gap: 0.6em;  
		padding: 0.625em;
    }

    .transaction {
        display: flex;
        column-gap: 1em;
        align-items: center;
        justify-content: space-between;
    }

    .item-name {
        flex-grow: 1;
    }

</style>
