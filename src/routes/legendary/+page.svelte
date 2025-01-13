<script lang="ts">
	import Awaiter from '$lib/components/awaiter.svelte';
	import SearchInput from '$lib/components/searchInput.svelte';
	import SearchHelp from '$lib/components/searchHelp.svelte';
	import { t as _ } from '$lib/services/i18n.js';
	import { grungeBorder } from '$lib/actions/grungeBorder';
	import { autotooltip } from '$lib/actions/autotooltip';
	import Legendary from '$lib/components/items/legendary.svelte';
	import { itemTooltipRenderer } from '$lib/components/items/itemTooltipRenderer';
	import { sum } from '$lib/utils';

	interface Props {
		data: any;
	}

	let { data }: Props = $props();

	let filter = $state('');

	const minReqWeapons = {
		Axe: 2,
		Dagger: 2,
		Focus: 1,
		Greatsword: 1,
		Hammer: 1,
		Harpoon: 1,
		LongBow: 1,
		Mace: 2,
		Pistol: 2,
		Rifle: 1,
		Scepter: 1,
		Shield: 1,
		ShortBow: 1,
		Speargun: 1,
		Staff: 1,
		Sword: 2,
		Torch: 1,
		Trident: 1,
		Warhorn: 1,
	};

	function done(items, minReq) {
		const completed = sum(items, 'count');
		return completed >= minReq;
	}

	function completionArmor(data) {
		let completed = 0;
		if (sum(data.Helm, 'count')) completed++;
		if (sum(data.Shoulders, 'count')) completed++;
		if (sum(data.Coat, 'count')) completed++;
		if (sum(data.Gloves, 'count')) completed++;
		if (sum(data.Leggings, 'count')) completed++;
		if (sum(data.Boots, 'count')) completed++;
		return completed;
	}

	function completionTrinkets(data) {
		let completed = 0;
		if (sum(data.back, 'count')) completed++;
		if (sum(data.trinkets.Accessory, 'count')) completed++;
		completed += Math.min(2, sum(data.trinkets.Ring, 'count')); // there are 2 rings, each with 2 mac_count, but we only want 2 as max
		if (sum(data.trinkets.Amulet, 'count')) completed++;
		return completed;
	}

	function completionUpgrades(data) {
		return sum(data.upgrades, 'count');
	}

	function completionWeapons(data) {
		let completed = 0;
		Object.keys(minReqWeapons).forEach(x => {
			completed += Math.min(minReqWeapons[x], sum(data[x], 'count'));
		})
		return completed;
	}

	const tooltipOptions = {
		customRenderers: {
			'img.item': itemTooltipRenderer,
		},
	};
</script>

<h1>{$_('legendary.legendary')}</h1>

<SearchInput bind:value={filter} name="filter" id="filter" placeholder={$_('common.too_much_data')}>
	<!-- <button on:click={sortAsIs}>original sort order</button>
		<button on:click={sortBySlots}>sort by quantity</button> -->
	<SearchHelp />
</SearchInput>

<img src="/gw2helper/assets/150px-construction.png" title={$_('common.under_construction')} width="150px" alt="under construction" />

<h3>{$_('legendary.armor')}</h3>

{#snippet unlocksList(caption, items, minReq = 1, restricted = false)}
	<div class="equip" class:done={done(items, minReq)} class:restricted>
		<h4>{caption}</h4>
		<div class="unlocks">
			{#each items as item}
				<Legendary {item} />
			{/each}
		</div>
	</div>
{/snippet}

<Awaiter promise={data.legendaries}>
	{#snippet unlockGroup(caption, weightData)}
		{@const progressArmor = completionArmor(weightData)}
		<details use:grungeBorder use:autotooltip={tooltipOptions}>
			<summary
				>{caption}
				<div class="info">
					<progress value={progressArmor} max={6}></progress>
					<span>{progressArmor} / 6</span>
				</div>
			</summary>
			<article>
				{@render unlocksList('Helm', weightData.Helm, 1, true)}
				{@render unlocksList('Shoulders', weightData.Shoulders, 1, true)}
				{@render unlocksList('Coat', weightData.Coat, 1, true)}
				{@render unlocksList('Gloves', weightData.Gloves, 1, true)}
				{@render unlocksList('Leggings', weightData.Leggings, 1, true)}
				{@render unlocksList('Boots', weightData.Boots, 1, true)}
			</article>
		</details>
	{/snippet}

	{#snippet children(result)}
		{@const progressTrinkets = completionTrinkets(result)}
		{@const progressUpgrades = completionUpgrades(result)}
		{@render unlockGroup('Light', result.armor.Light)}
		{@render unlockGroup('Medium', result.armor.Medium)}
		{@render unlockGroup('Heavy', result.armor.Heavy)}

		<details use:grungeBorder use:autotooltip={tooltipOptions}>
			<summary>
				{$_('legendary.trinkets')}
				<div class="info">
					<progress value={progressTrinkets} max={5}></progress>
					<span>{`${progressTrinkets} / 5`}</span>
				</div>
			</summary>
			<article>
				{@render unlocksList('Back', result.back)}
				{@render unlocksList('Accessory', result.trinkets.Accessory)}
				{@render unlocksList('Ring', result.trinkets.Ring, 2)}
				{@render unlocksList('Amulet', result.trinkets.Amulet)}
			</article>
		</details>

		<details use:grungeBorder use:autotooltip={tooltipOptions}>
			<summary>
				{$_('legendary.upgrades')}
				<div class="info">
					<progress value={progressUpgrades} max={3}></progress>
					<span>{progressUpgrades} / 3</span>
				</div>
			</summary>
			<article>
				{@render unlocksList('Upgrades', result.upgrades, 3)}
			</article>
		</details>
	{/snippet}
</Awaiter>

<h3>{$_('legendary.weapons')}</h3>

<Awaiter promise={data.legendaries}>
	{#snippet children(result)}
		{@const progressWeapons = completionWeapons(result.weapons)}
		<details use:grungeBorder use:autotooltip={tooltipOptions}>
			<summary>
				{$_('legendary.weapons')}
				<div class="info">
					<progress value={progressWeapons} max={24}></progress>
					<span>{progressWeapons} / 24</span>
				</div>
			</summary>
			<article>
				{#each Object.keys(minReqWeapons) as x}
					{@render unlocksList(x, result.weapons[x], minReqWeapons[x])}	
				{/each}
			</article>
		</details>
	{/snippet}
</Awaiter>

<style lang="scss">
	details {
		display: flex;
		flex-flow: column wrap;
		gap: 1em;
		margin: 0;
		background-color: var(--gw2helper-module);
		summary {
			display: flex;
			flex-flow: row nowrap;
			column-gap: 0.6em;
			justify-content: flex-start;
			align-items: center;
			&::before {
				content: '\25b6';
				transition: 0.2s;
			}
			.info {
				display: flex;
				flex-flow: column nowrap;
				justify-content: end;
				align-items: end;
				flex-grow: 1;
				@media screen and (min-width: 30em) {
					flex-flow: row nowrap;
					column-gap: 1em;
					justify-content: end;
					align-items: center;
				}
			}
		}
		&[open] summary::before {
			transform: rotate(90deg);
		}
	}
	progress[value] {
		height: 1em;
		width: 8em;
		border: none;
		color: var(--gw2helper-module-text) !important;
		background-color: var(--gw2helper-module-dark);
		&::-moz-progress-bar {
			background: var(--gw2helper-module-text);
		}
		&::-webkit-progress-value {
			background: var(--gw2helper-module-text);
		}
		&::-webkit-progress-bar {
			background: var(--gw2helper-module-dark);
		}
	}

	article {
		display: flex;
		flex-flow: row wrap;
		gap: 0.6rem;
	}

	.equip {
		background-color: var(--gw2helper-locked);
		padding: 1rem;
		&.done {
			background-color: var(--gw2helper-unlocked);
			padding: 1rem;
		}
	}

	.unlocks {
		display: flex;
		flex-flow: row wrap;
		gap: 0.625em;
	}

	@media (min-width: 900px) {
		.equip {
			&.restricted {
				max-width: 305px;
			}
		}
	}
</style>
