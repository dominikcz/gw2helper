<script lang="ts">
	import { asset } from "$app/paths";
	import Price from "$lib/components/price.svelte";
	import { t as _ } from '$lib/services/i18n';
	import type { MasteryReward, RewardsObj } from '$lib/types/achievements';

	interface Props {
		type: string;
		rewardsObj?: RewardsObj;
		done?: boolean;
		bits?: unknown[];
		bitsDone?: number[];
		pointsToGet?: number;
	}

	let {
		type = 'Default',
		rewardsObj = {},
		done = false,
		bits = [],
		bitsDone = [],
		pointsToGet = 0,
	}: Props = $props();
	let _bits = $derived(bits ? bits.length : 0);
	let _bitsDone = $derived(bits ? (done ? bits.length : (bitsDone || []).length) : 0);
</script>

<div class="rewards small">
	{#if type == 'ItemSet'}
		<div class="reward-item">
			<img src={asset('/assets/rewards/Talk_collection_option.png')} alt="title" title={$_('achievements.achievement_is_collection')} />
		</div>
	{/if}

	{#if rewardsObj.title}
		<div class="reward-item">
			<img src={asset('/assets/rewards/Title_icon.png')} alt="title" title={$_('achievements.achievement_is_title')} />
		</div>
	{/if}
	{#if rewardsObj.coins}
		<div class="reward-item">
			<Price value={rewardsObj.coins[0].count} />
		</div>
	{/if}
	{#if rewardsObj.item}
		<div class="reward-item">
			<img src={asset('/assets/rewards/Achievement_Chest_interface_icon.png')} alt="item" title={$_('achievements.achievement_is_item')} />
		</div>
	{/if}
	{#if rewardsObj.mastery}
		{#if rewardsObj.mastery.find((x: MasteryReward) => x.region == 'Tyria')}
			<div class="reward-item">
				<img
					src={asset('/assets/rewards/Mastery_point_Central_Tyria.png')}
					alt="mastery points Central Tyria"
					title={$_('achievements.achievement_is_mastery_tyria')}
				/>
			</div>
		{/if}
		{#if rewardsObj.mastery.find((x: MasteryReward) => x.region == 'Maguuma')}
			<div class="reward-item">
				<img
					src={asset('/assets/rewards/Mastery_point_Heart_of_Thorns.png')}
					alt="mastery points Heart of Thorns"
					title={$_('achievements.achievement_is_mastery_hot')}
				/>
			</div>
		{/if}
		{#if rewardsObj.mastery.find((x: MasteryReward) => x.region == 'Desert')}
			<div class="reward-item">
				<img
					src={asset('/assets/rewards/Mastery_point_Path_of_Fire.png')}
					alt="mastery points Path of Fire"
					title={$_('achievements.achievement_is_mastery_pof')}
				/>
			</div>
		{/if}
		{#if rewardsObj.mastery.find((x: MasteryReward) => x.region == 'Tundra')}
			<div class="reward-item">
				<img
					src={asset('/assets/rewards/Mastery_point_Icebrood_Saga.png')}
					alt="mastery points Icebrood Saga"
					title={$_('achievements.achievement_is_mastery_ice')}
				/>
			</div>
		{/if}
		{#if rewardsObj.mastery.find((x: MasteryReward) => x.region == 'Jade')}
			<div class="reward-item">
				<img
					src={asset('/assets/rewards/Mastery_point_End_of_Dragons.png')}
					alt="mastery points End of Dragons"
					title={$_('achievements.achievement_is_mastery_eod')}
				/>
			</div>
		{/if}
		{#if rewardsObj.mastery.find((x: MasteryReward) => x.region == 'Sky')}
			<div class="reward-item">
				<img
					src={asset('/assets/rewards/Mastery_point_Secrets_of_the_Obscure.png')}
					alt="mastery points Secrets of the Obscure"
					title={$_('achievements.achievement_is_mastery_soto')}
				/>
			</div>
		{/if}
		{#if rewardsObj.mastery.find((x: { region: string }) => x.region == 'Unknown')}
			<div class="reward-item">
				<img
					src={asset('/assets/rewards/Mastery_point_Janthir_Wilds.png')}
					alt="mastery points Janthir Wilds"
					title={$_('achievements.achievement_is_mastery_jw')}
				/>
			</div>
		{/if}
	{/if}
	{#if pointsToGet}
		<div class="reward-item">
			<span>{pointsToGet}</span>
			<img src={asset('/assets/rewards/AP.png')} alt="achievement points" title={$_('achievements.achievement_can_get', { pointsToGet })} />
		</div>
	{/if}
	{#if _bits}
		<div class="reward-item">
			<span>{_bitsDone} / {_bits}</span>
			<img
				src={asset('/assets/rewards/Achievements_Summary.png')}
				alt="achievements"
				title={$_('achievements.achievement_tasks_left', { left: _bits - _bitsDone })}
			/>
		</div>
	{/if}
</div>

<style lang="scss">
	.rewards {
		width: 100%;
		display: flex;
		flex-flow: row wrap;
		align-items: center;
		justify-content: flex-end;
		column-gap: 0.6em;
		row-gap: 0.2em;
		// font-family: monospace;

		.reward-item {
			display: flex;
			flex-flow: row nowrap;
			align-items: center;
			font-size: medium;
			img {
				width: 1.5em;
				height: 1.5em;
			}
		}
	}
</style>
