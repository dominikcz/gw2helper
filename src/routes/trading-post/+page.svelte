<script lang="ts">
	import { grungeBorder } from '$lib/actions/grungeBorder';
	import Awaiter from '$lib/components/awaiter.svelte';
	import DeliveryBox from '$lib/components/trading-post/deliveryBox.svelte';
	import TransactionList from '$lib/components/trading-post/transactionList.svelte';
	import { t as _ } from '$lib/services/i18n';

	/** @type {{data: any}} */
	let { data } = $props();
</script>

<h1>{$_('layout.nav.trading-post')}</h1>

<Awaiter promise={data.delivery} >
	{#snippet children(result: { coins: number; items: any[] })}
		<DeliveryBox coins={result.coins} items={result.items} showTradingPostLink={false}/>
	{/snippet}
</Awaiter>

<Awaiter promise={data.current} >
	{#snippet children(result: { buys: any[]; sells: any[] })}
		<div class="trading-container">
			<details open use:grungeBorder >
				<summary>{$_('trading-post.buying')}</summary>
				<TransactionList items={result.buys} offerType="buys" />
			</details>

			<details open use:grungeBorder >
				<summary>{$_('trading-post.selling')}</summary>
				<TransactionList items={result.sells} offerType="sells" />
			</details>
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
			details {
				// min-width: 45%;
				flex-grow: 1;
			}
		}
	}
</style>
