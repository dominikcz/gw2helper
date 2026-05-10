<script lang="ts">
	import Awaiter from '$lib/components/awaiter.svelte';
	import { t as _ } from '$lib/services/i18n';
	import { grungeBorder } from '$lib/actions/grungeBorder';
	import { autotooltip } from '$lib/actions/autotooltip';
	import Legendary from '$lib/components/items/legendary.svelte';
	import { itemTooltipRenderer } from '$lib/components/items/itemTooltipRenderer';
	import { sum } from '$lib/utils';
	import Progress from '$lib/components/progress/progress.svelte';
	import type { PageData } from './$types';
	import type { LegendariesData, LegendaryItemSummary } from '$lib/types/gw2-api';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const armorPiecesCount = 7; // Helm, Shoulders, Coat, Gloves, Leggings, Boots, Aquatic Helm

	type ArmorGroup = LegendariesData['armor']['Light'];
	type TrinketsGroup = LegendariesData['trinkets'];

	const minReqWeapons = {
		Axe: 2,
		Dagger: 2,
		Focus: 1,
		Greatsword: 1,
		Hammer: 1,
		'Harpoon gun': 1,
		'Long bow': 1,
		Mace: 2,
		Pistol: 2,
		Rifle: 1,
		Scepter: 1,
		Shield: 1,
		'Short bow': 1,
		Spear: 1,
		Staff: 1,
		Sword: 2,
		Torch: 1,
		Trident: 1,
		Warhorn: 1,
	} as Record<string, number>;

	function sumCount(items: LegendaryItemSummary[]) {
		return sum(items as unknown as Record<string, unknown>[], 'count');
	}

	function done(items: LegendaryItemSummary[], minReq: number) {
		const completed = sumCount(items);
		return completed >= minReq;
	}

	function completionArmor(data: ArmorGroup) {
		let completed = 0;
		if (sumCount(data.Helm)) completed++;
		if (sumCount(data.Shoulders)) completed++;
		if (sumCount(data.Coat)) completed++;
		if (sumCount(data.Gloves)) completed++;
		if (sumCount(data.Leggings)) completed++;
		if (sumCount(data.Boots)) completed++;
		return completed;
	}

	function completionTrinkets(data: { back: LegendaryItemSummary[]; trinkets: TrinketsGroup }) {
		let completed = 0;
		if (sumCount(data.back)) completed++;
		if (sumCount(data.trinkets.Accessory)) completed++;
		completed += Math.min(2, sumCount(data.trinkets.Ring)); // there are 2 rings, each with 2 mac_count, but we only want 2 as max
		if (sumCount(data.trinkets.Amulet)) completed++;
		return completed;
	}

	function completionUpgrades(data: { upgrades: LegendaryItemSummary[] }) {
		return sumCount(data.upgrades);
	}

	function completionWeapons(data: Record<string, LegendaryItemSummary[]>) {
		let completed = 0;
		Object.keys(minReqWeapons).forEach((x) => {
			completed += Math.min(minReqWeapons[x], sumCount(data[x]));
		});
		return completed;
	}

	const tooltipOptions = {
		customRenderers: {
			'img.item': itemTooltipRenderer,
		},
	};
</script>

<h1>{$_('legendary.legendary')}</h1>

<h3>{$_('legendary.armor')}</h3>

{#snippet unlocksList(caption: string, items: LegendaryItemSummary[], minReq = 1, restricted = false)}
	<div class="equip" class:done={done(items, minReq)} class:restricted>
		<h4>{caption}</h4>
		<div class="unlocks">
			{#each items as item}
				<Legendary {item} />
			{/each}
		</div>
	</div>
{/snippet}

{#snippet unlockGroup(caption: string, weightData: ArmorGroup)}
	{@const progressArmor = completionArmor(weightData)}
	<details use:grungeBorder use:autotooltip={tooltipOptions}>
		<summary
			>{$_('legendary.armor_type.'+caption.toLowerCase())}
			<div class="info">
				<Progress value={progressArmor} max={armorPiecesCount} label={`${progressArmor} / ${armorPiecesCount}`} />
			</div>
		</summary>
		<article>
			{@render unlocksList($_('legendary.armor_pieces.helm'), weightData.Helm, 1, true)}
			{@render unlocksList($_('legendary.armor_pieces.shoulders'), weightData.Shoulders, 1, true)}
			{@render unlocksList($_('legendary.armor_pieces.coat'), weightData.Coat, 1, true)}
			{@render unlocksList($_('legendary.armor_pieces.gloves'), weightData.Gloves, 1, true)}
			{@render unlocksList($_('legendary.armor_pieces.leggings'), weightData.Leggings, 1, true)}
			{@render unlocksList($_('legendary.armor_pieces.boots'), weightData.Boots, 1, true)}
			{@render unlocksList($_('legendary.armor_pieces.aquatic'), weightData.HelmAquatic, 1, true)}
		</article>
	</details>
{/snippet}

<Awaiter promise={data.legendaries as Promise<LegendariesData> | LegendariesData}>
	{#snippet children(result: LegendariesData)}
		{@const progressTrinkets = completionTrinkets(result)}
		{@const progressUpgrades = completionUpgrades(result)}
		{@render unlockGroup($_('legendary.armor_type_short.light'), result.armor.Light)}
		{@render unlockGroup($_('legendary.armor_type_short.medium'), result.armor.Medium)}
		{@render unlockGroup($_('legendary.armor_type_short.heavy'), result.armor.Heavy)}

		<details use:grungeBorder use:autotooltip={tooltipOptions}>
			<summary>
				{$_('legendary.trinkets')}
				<div class="info">
					<Progress value={progressTrinkets} max={5} label={`${progressTrinkets} / 5`} />
				</div>
			</summary>
			<article>
				{@render unlocksList($_('legendary.armor_pieces.back_item'), result.back)}
				{@render unlocksList($_('legendary.armor_pieces.accessory'), result.trinkets.Accessory)}
				{@render unlocksList($_('legendary.armor_pieces.ring'), result.trinkets.Ring, 2)}
				{@render unlocksList($_('legendary.armor_pieces.amulet'), result.trinkets.Amulet)}
			</article>
		</details>

		<details use:grungeBorder use:autotooltip={tooltipOptions}>
			<summary>
				{$_('legendary.upgrades')}
				<div class="info">
					<Progress value={progressUpgrades} max={3} label={`${progressUpgrades} / 3`} />
				</div>
			</summary>
			<article>
				{@render unlocksList($_('legendary.upgrades'), result.upgrades, 3)}
			</article>
		</details>
	{/snippet}
</Awaiter>

<h3>{$_('legendary.weapons')}</h3>

<Awaiter promise={data.legendaries as Promise<LegendariesData> | LegendariesData}>
	{#snippet children(result: LegendariesData)}
		{@const progressWeapons = completionWeapons(result.weapons)}
		<details use:grungeBorder use:autotooltip={tooltipOptions}>
			<summary>
				{$_('legendary.weapons')}
				<div class="info">
					<Progress value={progressWeapons} max={24} label={`${progressWeapons} / 24`} />
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

	@media (min-width: 480px) {
		article {
			display: flex;
			flex-flow: row wrap;
			gap: 0.6rem;
		}
	}

	@media (min-width: 900px) {
		.equip {
			&.restricted {
				max-width: 305px;
			}
		}
	}
</style>
