<script lang="ts">
	import Awaiter from '$lib/components/ui/awaiter.svelte';
	import { t as _ } from '$lib/services/i18n';
	import Legendary from '$lib/components/items/legendary.svelte';
	import CollapsibleSection from '$lib/components/ui/collapsibleSection.svelte';
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
			{#each items as item (item.id)}
				<Legendary {item} />
			{/each}
		</div>
	</div>
{/snippet}

{#snippet unlockGroup(caption: string, weightData: ArmorGroup)}
	{@const progressArmor = completionArmor(weightData)}
	<CollapsibleSection
		summary={$_('legendary.armor_type.' + caption.toLowerCase())}
		className=""
		tooltip={true}
		stickyTooltip={true}
		tooltipOptions={tooltipOptions}
	>
		{#snippet summaryExtra()}
			<div class="info">
				<Progress value={progressArmor} max={armorPiecesCount} label={`${progressArmor} / ${armorPiecesCount}`} />
			</div>
		{/snippet}
		<article>
			{@render unlocksList($_('legendary.armor_pieces.helm'), weightData.Helm, 1, true)}
			{@render unlocksList($_('legendary.armor_pieces.shoulders'), weightData.Shoulders, 1, true)}
			{@render unlocksList($_('legendary.armor_pieces.coat'), weightData.Coat, 1, true)}
			{@render unlocksList($_('legendary.armor_pieces.gloves'), weightData.Gloves, 1, true)}
			{@render unlocksList($_('legendary.armor_pieces.leggings'), weightData.Leggings, 1, true)}
			{@render unlocksList($_('legendary.armor_pieces.boots'), weightData.Boots, 1, true)}
			{@render unlocksList($_('legendary.armor_pieces.aquatic'), weightData.HelmAquatic, 1, true)}
		</article>
	</CollapsibleSection>
{/snippet}

<Awaiter promise={data.legendaries as Promise<LegendariesData> | LegendariesData}>
	{#snippet children(result: LegendariesData)}
		{@const progressTrinkets = completionTrinkets(result)}
		{@const progressUpgrades = completionUpgrades(result)}
		{@render unlockGroup($_('legendary.armor_type_short.light'), result.armor.Light)}
		{@render unlockGroup($_('legendary.armor_type_short.medium'), result.armor.Medium)}
		{@render unlockGroup($_('legendary.armor_type_short.heavy'), result.armor.Heavy)}

		<CollapsibleSection summary={$_('legendary.trinkets')} tooltip={true} stickyTooltip={true} tooltipOptions={tooltipOptions}>
			{#snippet summaryExtra()}
				<div class="info">
					<Progress value={progressTrinkets} max={5} label={`${progressTrinkets} / 5`} />
				</div>
			{/snippet}
			<article>
				{@render unlocksList($_('legendary.armor_pieces.back_item'), result.back)}
				{@render unlocksList($_('legendary.armor_pieces.accessory'), result.trinkets.Accessory)}
				{@render unlocksList($_('legendary.armor_pieces.ring'), result.trinkets.Ring, 2)}
				{@render unlocksList($_('legendary.armor_pieces.amulet'), result.trinkets.Amulet)}
			</article>
		</CollapsibleSection>

		<CollapsibleSection summary={$_('legendary.upgrades')} tooltip={true} stickyTooltip={true} tooltipOptions={tooltipOptions}>
			{#snippet summaryExtra()}
				<div class="info">
					<Progress value={progressUpgrades} max={3} label={`${progressUpgrades} / 3`} />
				</div>
			{/snippet}
			<article>
				{@render unlocksList($_('legendary.upgrades'), result.upgrades, 3)}
			</article>
		</CollapsibleSection>

		<h3>{$_('legendary.weapons')}</h3>
		{@const progressWeapons = completionWeapons(result.weapons)}
		<CollapsibleSection summary={$_('legendary.weapons')} tooltip={true} stickyTooltip={true} tooltipOptions={tooltipOptions}>
			{#snippet summaryExtra()}
				<div class="info">
					<Progress value={progressWeapons} max={24} label={`${progressWeapons} / 24`} />
				</div>
			{/snippet}
			<article>
				{#each Object.keys(minReqWeapons) as x}
					{@render unlocksList(x, result.weapons[x], minReqWeapons[x])}
				{/each}
			</article>
		</CollapsibleSection>
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

