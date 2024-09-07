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

	let filter = '';
	const fields = ['name', 'description'];
	let showDepreciated = false;

	function formatValue(v: number) {
		return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
	}

	function getTitle(currency) {
		return `<h4>${currency.name} (${currency.id}) - <a class="autotooltip-link" target="_blank" href="${helperUtils.wikiLink(currency.name)}">Click for wiki</a></h4>
			${currency.depreciated ? '<p class="warning"><strong>DEPRECIATED:</strong> ' + currency.depreciationReason + '</p>' : ''}
			<p>${currency.description}</p>`;
	}
	
	function saveSettings() {
		utils.saveWalletSettings({
			showDepreciated,
		});
	}

	onMount(async () => {
		const settings = await utils.readWalletSettings();
		showDepreciated = settings.showDepreciated;
	});
</script>

<h1>Home</h1>

<Awaiter promise={data.delivery} let:result>
	{#if result.coins || result.items.length}
		<details open class="bltc">
			<summary>Delivery Box</summary>
			<div class="delivery-box autotooltip" use:autotooltip>
				{#if result.coins}
					<WidgetInfo title="Coins for pickup" value={result.coins} let:value id="bltc-coins">
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

<h2>Your wallet</h2>

<fieldset class="settings">
	<legend>Settings</legend>

	<label><input type="checkbox" id="chat-links" bind:checked={showDepreciated} /> Show depreciated currencies</label>
	<button on:click={saveSettings}>Save settings</button>
</fieldset>

<section>
	<SearchInput bind:value={filter} name="filter" id="filter" placeholder="too much data?" />
</section>

<Awaiter promise={data.wallet} let:result>
	<section class="wallet" use:autotooltip>
		{#each helperUtils.filterCollection(result, fields, filter, { nonZero: !showDepreciated, nonZeroField: 'active' }) as currency}
			<a href={helperUtils.wikiLink(currency.name)} target="_blank" class="autotooltip">
				<div class="currency autotooltip" class:depreciated={currency.depreciated} title={getTitle(currency)} data-autotooltip-class="autotooltip-wide">
					<span class="currency-name autotooltip" title={getTitle(currency)}>{currency.name}</span>
					<div class="currency-value">
						{#if currency.id == 1}
							<Price value={currency.value} />
						{:else}
							<span class:karma={currency.id == 2}>{formatValue(currency.value || 0)}</span>
							<img src={currency.icon} alt={currency.name} title={getTitle(currency)} class="autotooltip" />
						{/if}
					</div>
				</div>
			</a>
		{/each}
	</section>
</Awaiter>

<style lang="scss">
	.wallet {
		max-width: 37.5em;
		display: flex;
		flex-flow: column nowrap;
		gap: 0.2em;
		a {
			text-decoration: none;
		}
	}
	.currency {
		min-height: 2em;
		background-color: var(--gw2helper-module);
		color: var(--gw2helper-module-text);
		padding: 0 0.4em;
		gap: 1em;
		display: flex;
		flex-flow: row nowrap;
		justify-content: space-between;
		align-items: center;
		&.depreciated {
			color: var(--gw2helper-not-important);
		}
		img {
			height: 2em;
		}
		.currency-value {
			display: flex;
			flex-flow: row nowrap;
			justify-content: flex-end;
			align-items: center;
			column-gap: 0.5em;
			font-size: 120%;
		}
	}

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
