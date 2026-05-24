<script lang="ts">
	import Awaiter from '$lib/components/ui/awaiter.svelte';
	import CollapsibleSection from '$lib/components/ui/collapsibleSection.svelte';
	import DeliveryBox from '$lib/components/trading-post/deliveryBox.svelte';
	import TransactionList from '$lib/components/trading-post/transactionList.svelte';
	import { t as _ } from '$lib/services/i18n';
	import type { PageData } from './$types';
	import type { DeliveryData, TransactionCurrentItem } from '$lib/types/gw2-api';

	let { data }: { data: PageData } = $props();
</script>

<h1>{$_('layout.nav.trading-post')}</h1>

<Awaiter promise={data.delivery} >
	{#snippet children(result: DeliveryData)}
		<DeliveryBox coins={result.coins} items={result.items} showTradingPostLink={false}/>
	{/snippet}
</Awaiter>

<Awaiter promise={data.current} >
	{#snippet children(result: { buys: TransactionCurrentItem[]; sells: TransactionCurrentItem[] })}
		<div class="trading-container">
			<CollapsibleSection summary={$_('trading-post.buying')} open={true}>
				<TransactionList items={result.buys} offerType="buys" />
			</CollapsibleSection>

			<CollapsibleSection summary={$_('trading-post.selling')} open={true}>
				<TransactionList items={result.sells} offerType="sells" />
			</CollapsibleSection>
		</div>
	{/snippet}
</Awaiter>

<style lang="scss" global>
	.trading-container {
		display: flex;
		flex-flow: column wrap;
		gap: 1em;
	}
	@media (min-width: 900px) {
		.trading-container {
			flex-flow: row wrap;
			:global(details) {
				// min-width: 45%;
				flex-grow: 1;
			}
		}
	}
</style>

