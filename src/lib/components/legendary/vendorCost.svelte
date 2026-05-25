<script lang="ts">
	import ItemLabel from '$lib/components/items/itemLabel.svelte';
	import { t as _ } from '$lib/services/i18n';
	import helperUtils from '$lib/utils/helper-utils';
	import type { ItemAcquisition, ItemSummary, VendorCost as VendorCostType } from '$lib/legendary/calculator-types';

	interface Props {
		acquisition: ItemAcquisition;
		itemsById: Record<number, ItemSummary>;
	}

	let { acquisition, itemsById }: Props = $props();

	function itemInfo(id: number) {
		return itemsById[id];
	}

	function decodeHtmlEntities(str: string): string {
		if (!str) return str;
		return str
			.replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
			.replace(/&amp;/g, '&')
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'");
	}

	function wikiHref(id: number) {
		const name = itemInfo(id)?.name;
		return name ? helperUtils.wikiLink(name) : undefined;
	}

	const costs = $derived.by(() => {
		const seen = new Set<string>();
		const result: VendorCostType[] = [];
		for (const vendor of acquisition.vendors) {
			for (const c of vendor.cost) {
				const key = `${c.amount}:${c.item_name}`;
				if (!seen.has(key)) {
					seen.add(key);
					result.push(c);
				}
			}
		}
		return result;
	});
</script>

<div class="vendor-acquisition">
	{#each costs as c, ci (`${c.amount}:${c.item_name}:${ci}`)}
		{#if ci > 0}<span class="acq-sep"> + </span>{/if}
		<span class="acq-cost-entry">
			<ItemLabel
				class="neutral-label"
				id={c.item_id}
				name={(c.item_id ? itemInfo(c.item_id)?.name : null) ?? decodeHtmlEntities(c.item_name)}
				icon={(c.item_id ? itemInfo(c.item_id)?.icon : null) ?? c.icon_url}
				href={c.item_id ? wikiHref(c.item_id) : undefined}
				linkTitle={$_('common.click_for_wiki')}
				count={c.amount}
				showCount={true}
				countOnIcon={true}
				iconSize="1.2rem"
			/>
		</span>
	{/each}
</div>

<style lang="scss">
	.vendor-acquisition {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.85rem;
		color: var(--gw2helper-muted, #aaa);
	}

	.acq-cost-entry {
		display: inline-flex;
		align-items: center;
		gap: 0.15rem;
		white-space: nowrap;
	}

	.acq-sep {
		opacity: 0.6;
	}
</style>
