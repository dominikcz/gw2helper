<script lang="ts">
	import { onMount } from 'svelte';
	import helperUtils from '$lib/utils/helper-utils';
	import Awaiter from '$lib/components/awaiter.svelte';
	import SearchInput from '$lib/components/searchInput.svelte';
	import utils from '$lib/utils';
	import Currencies from '$lib/components/currencies/currencies.svelte';
	import { t as _ } from '$lib/services/i18n.js';
	import DeliveryBox from '$lib/components/trading-post/deliveryBox.svelte';
	interface Props {
		data: any;
	}

	let { data }: Props = $props();

	let filter = $state('');
	const fields = ['name', 'description'];
	let showDepreciated = $state(false);
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

	function hndWalletReorder(ev: CustomEvent) {
		const order = ev.detail.order;
		utils.saveWalletOrder(order);
	}
</script>

<h1>{$_('home.title')}</h1>

<Awaiter promise={data.delivery} >
	{#snippet children(result)}
		<DeliveryBox coins={result.coins} items={result.items} />
	{/snippet}
</Awaiter>

<h2>{$_('home.your_wallet')}</h2>

<section>
	<SearchInput bind:value={filter} name="filter" id="filter" placeholder={$_('common.too_much_data')} />
</section>

<Awaiter promise={data.wallet} >
	{#snippet children(result)}
		<Currencies
			items={helperUtils.filterCollection(result, fields, filter, { nonZero: !showDepreciated, nonZeroField: 'active' })}
			on:wallet-reorder={hndWalletReorder}
		/>
	{/snippet}
</Awaiter>

<fieldset class="settings">
	<legend>{$_('common.settings')}</legend>

	<label><input type="checkbox" id="chat-links" bind:checked={showDepreciated} /> {$_('home.show_depreciated_currencies')}</label>
	<button onclick={saveSettings}>{$_('common.save_settings')}</button>
</fieldset>
