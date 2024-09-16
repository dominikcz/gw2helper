<script lang="ts">
	import { onMount } from 'svelte';
	import helperUtils from '$lib/utils/helper-utils';
	import Price from '$lib/components/price.svelte';
	import Awaiter from '$lib/components/awaiter.svelte';
	import SearchInput from '$lib/components/searchInput.svelte';
	import WidgetInfo from '$lib/components/widgets/widgetInfo.svelte';
	import ItemsList from '$lib/components/items/itemsList.svelte';
	import utils from '$lib/utils';
	export let data;
	import { autotooltip } from '$lib/actions/autotooltip.js';
	import Currencies from '$lib/components/currencies/currencies.svelte';
	import { _ } from 'svelte-i18n';

	let filter = '';
	const fields = ['name', 'description'];
	let showDepreciated = false;
	let items = [];

	function saveSettings() {
		utils.saveWalletSettings({
			showDepreciated,
		});
	}

	onMount(async () => {
		const settings = await utils.readWalletSettings();
		showDepreciated = settings.showDepreciated;
	});

	function hndWalletReorder(ev) {
		const order = ev.detail.order;
		utils.saveWalletOrder(order);
	}
</script>

<h1>{$_('home.title')}</h1>

<Awaiter promise={data.delivery} let:result>
	{#if result.coins || result.items.length}
		<details open class="bltc">
			<summary>{$_('home.delivery_box')}</summary>
			<div class="delivery-box autotooltip" use:autotooltip>
				{#if result.coins}
					<WidgetInfo title={$_('home.coins_for_pickup')} value={result.coins} let:value id="bltc-coins">
						<Price {value} />
					</WidgetInfo>
				{/if}
				{#if result.items.length}
					<ItemsList summary="Items for pickup" items={result.items} {filter} />
				{/if}
			</div>
		</details>
	{/if}
</Awaiter>

<h2>{$_('home.your_wallet')}</h2>

<section>
	<SearchInput bind:value={filter} name="filter" id="filter" placeholder={$_('common.too_much_data')} />
</section>

<Awaiter promise={data.wallet} let:result>
	<Currencies
		items={helperUtils.filterCollection(result, fields, filter, { nonZero: !showDepreciated, nonZeroField: 'active' })}
		on:wallet-reorder={hndWalletReorder}
	/>
</Awaiter>

<fieldset class="settings">
	<legend>{$_('home.settings')}</legend>

	<label><input type="checkbox" id="chat-links" bind:checked={showDepreciated} /> {$_('home.show_depreciated_currencies')}</label>
	<button on:click={saveSettings}>{$_('common.save_settings')}</button>
</fieldset>

<style lang="scss">
	.delivery-box {
		margin: 0 0.6em;
		display: flex;
		flex-flow: column nowrap;
		gap: 0.625em;
		align-items: normal;
	}

	.bltc {
		summary {
			background: url(/gw2helper/assets/Trading_Post.png) no-repeat center right 0.6em;
			background-size: 3em;
		}
	}

	:global(#bltc-coins .value) {
		font-size: 1.4em;
	}
	// @media (prefers-color-scheme: dark) {
	// 	.currency {

	// 	}
	// }
</style>
