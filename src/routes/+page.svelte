<script lang="ts">
	import helperUtils from '$lib/utils/helper-utils';
	import Price from '$lib/components/price.svelte';
	import Awaiter from '$lib/components/awaiter.svelte';
	import SearchInput from '$lib/components/searchInput.svelte';
	export let data;
	let filter = '';
	const fields = ['name', 'description'];

	function formatValue(v: number) {
		return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
	}
</script>

<h1>Home - Your wallet</h1>

<section>
	<label for="filter">Filter:</label>
	<SearchInput bind:value={filter} name="filter" id="filter" placeholder="too much data?" />
</section>
<Awaiter promise={data.wallet} let:result>
	<section class="wallet">
		{#each helperUtils.filterCollection(result, fields, filter) as currency}
			<a 
				href={`https://wiki.guildwars2.com/wiki/${currency.name}`}
				target="_blank"
				title={`${currency.name} (${currency.id})- Click for wiki\r\n${currency.depreciated? '\r\nDEPRECIATED: '+currency.depreciationReason+'\r\n': ''}\r\n${currency.description}`}
			>
				<div class="currency" class:depreciated={currency.depreciated}>
					<span class="currency-name">{currency.name}</span>
					<div class="currency-value">
						{#if currency.id == 1}
							<Price value={currency.value} />
						{:else}
							<span class:karma={currency.id == 2}>{formatValue(currency.value || 0)}</span>
							<img src={currency.icon} alt={currency.name} />
						{/if}
					</div>
				</div>
			</a>
		{/each}
	</section>
</Awaiter>

<style lang="scss">
	.wallet {
		max-width: 600px;
		display: flex;
		flex-flow: column nowrap;
		gap: 0.2rem;
		a {
			text-decoration: none;
		}
	}
	.currency {
		min-height: 2rem;
		background-color: var(--gw2helper-module);
		color: #000;
		padding: 0 0.4rem;
		gap: 1rem;
		display: flex;
		flex-flow: row nowrap;
		justify-content: space-between;
		align-items: center;
		&.depreciated{
			color: var(--gw2helper-not-important);
		}
		img {
			height: 2rem;
		}
		.currency-value {
			display: flex;
			flex-flow: row nowrap;
			justify-content: flex-end;
			align-items: center;
			column-gap: 0.5rem;
		}
	}
</style>
