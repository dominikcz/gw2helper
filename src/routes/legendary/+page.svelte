<script lang="ts">
	import Awaiter from '$lib/components/ui/awaiter.svelte';
	import { t as _ } from '$lib/services/i18n';
	import { grungeBorder } from '$lib/actions/grungeBorder';
	import { autotooltip } from '$lib/actions/autotooltip';
	import Legendary from '$lib/components/items/legendary.svelte';
	import { itemTooltipRenderer } from '$lib/components/items/itemTooltipRenderer';
	import Progress from '$lib/components/progress/progress.svelte';
	import {
		minReqWeapons,
		done,
		completionArmor,
		completionTrinkets,
		completionUpgrades,
		completionWeapons,
	} from '$lib/components/items/legendary-utils';
	import type { PageData } from './$types';
	import type { LegendariesData, LegendaryItemSummary } from '$lib/types/gw2-api';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	const armorPiecesCount = 7; // Helm, Shoulders, Coat, Gloves, Leggings, Boots, Aquatic Helm

	type ArmorGroup = LegendariesData['armor']['Light'];

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

		<h3>{$_('legendary.weapons')}</h3>
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

