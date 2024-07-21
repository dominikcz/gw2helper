<script lang="ts">
	import { onMount } from 'svelte';
	import helperUtils from '$lib/utils/helper-utils';
	import Price from '$lib/components/price.svelte';
	import Awaiter from '$lib/components/awaiter.svelte';
	import SearchInput from '$lib/components/searchInput.svelte';
	import WidgetInfo from '$lib/components/widgetInfo.svelte';
	import WidgetsGroup from '$lib/components/widgetsGroup.svelte';
	import WidgetImg from '$lib/components/widgetImg.svelte';
	import { base } from '$app/paths';
	import ItemsList from '$lib/components/itemsList.svelte';
	import utils from '$lib/utils';
	export let data;

	let filter = '';
	const fields = ['name', 'description'];
	let showDepreciated = false;

	function formatValue(v: number) {
		return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
	}

	function timeSpent(account) {
		const hours = helperUtils.hoursPlayed(account.age);
		const days = helperUtils.diff(account.created);
		const hoursPerDay = (days / hours).toFixed(2);
		return `${hours} hours over the past ${days} days (avg ${hoursPerDay}h per day)`;
	}

	function has(account, content: string): boolean {
		return account.access.includes(content);
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

	onMount(async () =>{
		const settings = await utils.readWalletSettings();
		showDepreciated = settings.showDepreciated;
	});

</script>

<h1>Home</h1>

<details>
	<summary>Account info</summary>
	<article>
		<Awaiter promise={data.account} let:result>
			<h3>{result.name}</h3>
			<p>Created at: <span>{result.created_local}</span></p>
			<p>Last change: <span>{result.last_modified_local}</span></p>

			<WidgetsGroup name="Time spent">
				<WidgetInfo title="Hours played" value={`${helperUtils.hoursPlayed(result.age)}h`} />
				<WidgetInfo title="Days" value={`${helperUtils.diff(result.created)}h`} />
				<WidgetInfo
					title="Average time per day"
					value={`${(helperUtils.hoursPlayed(result.age) / helperUtils.diff(result.created)).toFixed(2)}h/day`}
				/>
			</WidgetsGroup>

			<WidgetsGroup name="Accessible content">
				{#if has(result, 'PlayForFree')}
					<WidgetImg
						title="Play for free"
						url="{base}/assets/400px-GW2Logo_new.png"
						link="https://wiki.guildwars2.com/wiki/Guild_Wars_2"
						linkTitle="Read more on wiki"
						class="autotooltip"
					/>
				{/if}

				{#if has(result, 'GuildWars2')}
					<WidgetImg
						title="Base game"
						url={`${base}/assets/400px-GW2Logo_new.png`}
						link="https://wiki.guildwars2.com/wiki/Guild_Wars_2"
						linkTitle="Read more on wiki"
						class="autotooltip"
					/>
				{/if}

				{#if has(result, 'HeartOfThorns')}
					<WidgetImg
						title="Heart Of Thorns"
						url={`${base}/assets/400px-HoT_Texture_Centered_Trans.png`}
						link="https://wiki.guildwars2.com/wiki/Guild_Wars_2:_Heart_of_Thorns"
						linkTitle="Read more on wiki"
						class="autotooltip"
					/>
				{/if}

				{#if has(result, 'PathOfFire')}
					<WidgetImg
						title="Path Of Fire"
						url={`${base}/assets/400px-GW2-PoF_Texture_Centered_Trans.png`}
						link="https://wiki.guildwars2.com/wiki/Guild_Wars_2:_Path_of_Fire"
						linkTitle="Read more on wiki"
						class="autotooltip"
					/>
				{/if}

				{#if has(result, 'EndOfDragons')}
					<WidgetImg
						title="End Of Dragons"
						url={`${base}/assets/400px-EoD_Texture_Trans.png`}
						link="https://wiki.guildwars2.com/wiki/Guild_Wars_2:_End_of_Dragons"
						linkTitle="Read more on wiki"
						class="autotooltip"
					/>
				{/if}

				{#if has(result, 'SecretsOfTheObscure')}
					<WidgetImg
						title="Secrets of the Obscure"
						url={`${base}/assets/400px-Secrets_of_the_Obscure_logo.png`}
						link="https://wiki.guildwars2.com/wiki/Guild_Wars_2:_Secrets_of_the_Obscure"
						linkTitle="Read more on wiki"
						class="autotooltip"
					/>
				{/if}

				{#if has(result, 'JanthirWilds')}
					<WidgetImg
						title="Janthir Wilds"
						url={`${base}/assets/400px-Janthir_Wilds_logo.png`}
						link="https://wiki.guildwars2.com/wiki/Guild_Wars_2:_Janthir_Wilds"
						linkTitle="Read more on wiki"
						class="autotooltip"
					/>
				{/if}
			</WidgetsGroup>

			<WidgetsGroup name="Levels">
				<WidgetInfo title="Fractals" value={result.fractal_level} image="{base}/assets/rewards/Daily_Fractals.png" />
				<WidgetInfo title="WvW" value={result.wvw_rank} image="{base}/assets/rewards/WvW_Ability_Point.png" />
			</WidgetsGroup>
		</Awaiter>
	</article>
</details>

<Awaiter promise={data.delivery} let:result>
	{#if result.coins || result.items.length}
		<details open>
			<summary>Delivery Box</summary>
			<div class="inner-content">
				{#if result.coins}
					<WidgetInfo title="Coins for pickup" value={result.coins} let:value>
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
<section>
	<label for="filter">Filter:</label>
	<SearchInput bind:value={filter} name="filter" id="filter" placeholder="too much data?" />
</section>

<fieldset class="settings">
	<legend>Settings</legend>

	<label><input type="checkbox" id="chat-links" bind:checked={showDepreciated} /> Show depreciated currencies</label>
	<button on:click={saveSettings}>Save settings</button>
</fieldset>

<Awaiter promise={data.wallet} let:result>
	<section class="wallet">
		{#each helperUtils.filterCollection(result, fields, filter, {nonZero: !showDepreciated, nonZeroField: 'active'}) as currency}
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
		&.depreciated {
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
			font-size: 120%;
		}
	}

	.inner-content {
		margin: 0 0.6em;
	}
</style>
