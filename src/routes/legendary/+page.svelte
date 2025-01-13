<script lang="ts">
	import Awaiter from '$lib/components/awaiter.svelte';
	import SearchInput from '$lib/components/searchInput.svelte';
	import SearchHelp from '$lib/components/searchHelp.svelte';
	import { t as _ } from '$lib/services/i18n.js';
	import { grungeBorder } from '$lib/actions/grungeBorder';
	import { autotooltip } from '$lib/actions/autotooltip';
	import Legendary from '$lib/components/items/legendary.svelte';
	import { itemTooltipRenderer } from '$lib/components/items/itemTooltipRenderer';

	interface Props {
		data: any;
	}

	let { data }: Props = $props();

	let filter = $state('');

	function done(items, allRequired, caption) {
		return allRequired ? items.every((x) => x.count) : items.some((x) => x.count);
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

{#snippet unlocksList(caption, items, all = false, restricted = false)}
	<div class="equip" class:done={done(items, all, caption)} class:restricted={restricted}>
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
		<details use:grungeBorder use:autotooltip={tooltipOptions}>
			<summary>{caption}</summary>
			<article>
				{@render unlocksList('Helm', weightData.Helm, false, true)}
				{@render unlocksList('Shoulders', weightData.Shoulders, false, true)}
				{@render unlocksList('Coat', weightData.Coat, false, true)}
				{@render unlocksList('Gloves', weightData.Gloves, false, true)}
				{@render unlocksList('Leggings', weightData.Leggings, false, true)}
				{@render unlocksList('Boots', weightData.Boots, false, true)}
			</article>
		</details>
	{/snippet}

	{#snippet children(result)}
		{@render unlockGroup('Light', result.armor.Light)}
		{@render unlockGroup('Medium', result.armor.Medium)}
		{@render unlockGroup('Heavy', result.armor.Heavy)}

		<details use:grungeBorder use:autotooltip={tooltipOptions}>
			<summary>{$_('legendary.trinkets')}</summary>
			<article>
				{@render unlocksList('Back', result.back)}
				{@render unlocksList('Accessory', result.trinkets.Accessory)}
				{@render unlocksList('Ring', result.trinkets.Ring, true)}
				{@render unlocksList('Amulet', result.trinkets.Amulet)}
			</article>
		</details>

		<details use:grungeBorder use:autotooltip={tooltipOptions}>
			<summary>{$_('legendary.upgrades')}</summary>
			<article>
				{@render unlocksList('Upgrades', result.upgrades, true)}
			</article>
		</details>
	{/snippet}
</Awaiter>

<h3>{$_('legendary.weapons')}</h3>

<Awaiter promise={data.legendaries}>
	{#snippet children(result)}
		<details use:grungeBorder use:autotooltip={tooltipOptions}>
			<summary>{$_('legendary.weapons')}</summary>
			<article>
				{@render unlocksList('Axe', result.weapons.Axe)}
				{@render unlocksList('Dagger', result.weapons.Dagger)}
				{@render unlocksList('Focus', result.weapons.Focus)}
				{@render unlocksList('Greatsword', result.weapons.Greatsword)}
				{@render unlocksList('Hammer', result.weapons.Hammer)}
				{@render unlocksList('Harpoon gun/Spear', result.weapons.Harpoon)}
				{@render unlocksList('Longbow', result.weapons.LongBow)}
				{@render unlocksList('Mace', result.weapons.Mace)}
				{@render unlocksList('Pistol', result.weapons.Pistol)}
				{@render unlocksList('Rifle', result.weapons.Rifle)}
				{@render unlocksList('Scepter', result.weapons.Scepter)}
				{@render unlocksList('Shield', result.weapons.Shield)}
				{@render unlocksList('Short bow', result.weapons.ShortBow)}
				{@render unlocksList('Speargun', result.weapons.Speargun)}
				{@render unlocksList('Staff', result.weapons.Staff)}
				{@render unlocksList('Sword', result.weapons.Sword)}
				{@render unlocksList('Torch', result.weapons.Torch)}
				{@render unlocksList('Trident', result.weapons.Trident)}
				{@render unlocksList('Warhorn', result.weapons.Warhorn)}
			</article>
		</details>
	{/snippet}
</Awaiter>

<style lang="scss">
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
