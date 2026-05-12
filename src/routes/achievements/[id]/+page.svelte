<script lang="ts">
	import { asset, resolve } from '$app/paths';
	import apiService from '$lib/apiService';
	import Achievement from '$lib/components/achievements/achievement.svelte';
	import AchievementProgress from '$lib/components/achievements/achievementProgress.svelte';
	import RewardRow from '$lib/components/achievements/rewardRow.svelte';
	import Item from '$lib/components/items/item.svelte';
	import Linkable from '$lib/components/ui/linkable.svelte';
	import Price from '$lib/components/currencies/price.svelte';
	import { t as _ } from '$lib/services/i18n';
	import helperUtils from '$lib/utils/helper-utils';
	import utils from '$lib/utils';
	import type { AchievementLike, CategoryLike } from '$lib/components/achievements/achievements';
	import type { AchievementBit, MasteryReward, RewardsObj } from '$lib/types/achievements';
	import type { ApiAchievementRewardDto } from '$lib/types/gw2-api';

	type AchievementWithBitsDone = AchievementLike & { bits_done?: number[] };
	interface Props {
		data: {
			achievement: AchievementWithBitsDone | null;
			category: CategoryLike | null;
			isTodo: boolean;
			prerequisites: Array<{ id: number; name?: string; done?: boolean }>;
			rewardItems: Array<{ id: number; name?: string; icon?: string; rarity?: string }>;
			rewardTitles: Array<{ id: number; name?: string }>;
		};
	}

	let { data }: Props = $props();
	let todoList = $state<number[]>([]);

	$effect(() => {
		todoList = data.isTodo && data.achievement?.id ? [Number(data.achievement.id)] : [];
	});

	function onToggleTodo(event: { id: number; todo: boolean }) {
		utils.hndToggleTodo(event, todoList);
	}

	function tierDone(current: number, count: number) {
		return current >= count;
	}

	function masteryIcon(region?: string) {
		switch (region) {
			case 'Tyria':
				return asset('/assets/rewards/Mastery_point_Central_Tyria.png');
			case 'Maguuma':
				return asset('/assets/rewards/Mastery_point_Heart_of_Thorns.png');
			case 'Desert':
				return asset('/assets/rewards/Mastery_point_Path_of_Fire.png');
			case 'Tundra':
				return asset('/assets/rewards/Mastery_point_Icebrood_Saga.png');
			case 'Jade':
				return asset('/assets/rewards/Mastery_point_End_of_Dragons.png');
			case 'Sky':
				return asset('/assets/rewards/Mastery_point_Secrets_of_the_Obscure.png');
			case 'Wild':
				return asset('/assets/rewards/Mastery_point_Janthir_Wilds.png');
			default:
				return asset('/assets/rewards/Achievements_Summary.png');
		}
	}

	function masteryText(region?: string) {
		switch (region) {
			case 'Tyria':
				return $_('achievements.achievement_is_mastery_tyria');
			case 'Maguuma':
				return $_('achievements.achievement_is_mastery_hot');
			case 'Desert':
				return $_('achievements.achievement_is_mastery_pof');
			case 'Tundra':
				return $_('achievements.achievement_is_mastery_ice');
			case 'Jade':
				return $_('achievements.achievement_is_mastery_eod');
			case 'Sky':
				return $_('achievements.achievement_is_mastery_soto');
			case 'Wild':
				return $_('achievements.achievement_is_mastery_jw');
			default:
				return $_('achievements.achievement_is_mastery_jw');
		}
	}
</script>

			<p>
				<a class="back-link" href={resolve('/achievements/')}>
					<img src={asset('/assets/Game_menu_return_icon.png')} alt="back" />
					<span>{$_('achievements.back_to_list')}</span>
				</a>
			</p>

{#if !data.achievement}
	<h1>{$_('achievements.achievements')}</h1>
	<p class="no-results">{$_('achievements.details_not_found')}</p>
{:else}
	{@const achiev = data.achievement}
	{@const bits = (achiev.bits || []) as AchievementBit[]}
	{@const bitsDone = achiev.bits_done || []}
	{@const current = Number(achiev.current || 0)}
	{@const max = Number(achiev.max || 0)}
	{@const pointsToGet = Number(achiev.points_to_get || 0)}
	{@const tiers = (achiev.tiers || []) as Array<{ count: number; points?: number }>}
	{@const rewards = (achiev.rewardsObj || {}) as RewardsObj}
	{@const rewardsRaw = (achiev.rewards || []) as ApiAchievementRewardDto[]}
	{@const prerequisites = data.prerequisites || []}
	{@const rewardItemsMap = new Map((data.rewardItems || []).map((x) => [Number(x.id), x]))}
	{@const rewardTitlesMap = new Map((data.rewardTitles || []).map((x) => [Number(x.id), x]))}
	{@const titleRewards = rewardsRaw.filter((r) => r.type === 'Title' && r.id != null)}
	{@const itemRewards = rewardsRaw.filter((r) => r.type === 'Item' && r.id != null)}
	{@const coinRewards = rewardsRaw.filter((r) => r.type === 'Coins')}
	{@const masteryRewards = rewardsRaw.filter((r) => r.type === 'Mastery')}
	{@const hasRewardBreakdown =
		String(achiev.type || 'Default') === 'ItemSet' ||
		titleRewards.length > 0 ||
		itemRewards.length > 0 ||
		coinRewards.length > 0 ||
		masteryRewards.length > 0 ||
		rewards.title ||
		rewards.item ||
		pointsToGet > 0 ||
		Boolean(prerequisites.length)}
	{@const hasProgressSection = bits.length > 0}
	<section class="achiev-details-page">
		<div class="page-head">
			{#if data.category?.name}
				<h2>{data.category.name}</h2>
			{/if}
		</div>

		<Achievement
			id={achiev.id ?? 0}
			icon={achiev.icon}
			name={achiev.name}
			type={achiev.type}
			description={achiev.description}
			requirement={achiev.requirement}
			current={achiev.current}
			max={achiev.max}
			flags={achiev.flags}
			todo={todoList.includes(achiev.id ?? 0)}
			rewardsObj={achiev.rewardsObj}
			done={achiev.done}
			{bits}
			{bitsDone}
			pointsToGet={achiev.points_to_get}
			tiers={achiev.tiers as Array<{ count: number; points?: number }>}
			showTooltip={false}
			showDetailsLink={false}
			{onToggleTodo}
		/>

		<div class="details-grid">
			{#if hasRewardBreakdown}
				<section class="details-card rewards-breakdown grunge-border">
					<h3>{$_('achievements.rewards_breakdown')}</h3>
					<ul class="reward-list">
						{#if String(achiev.type || 'Default') === 'ItemSet'}
							<RewardRow icon={asset('/assets/rewards/Talk_collection_option.png')} alt="collection">
								<span>{$_('achievements.achievement_is_collection')}</span>
							</RewardRow>
						{/if}

						{#if titleRewards.length}
							{#each titleRewards as reward, idx (`title-${reward.id ?? idx}-${idx}`)}
								{@const titleId = Number(reward.id || 0)}
								{@const title = rewardTitlesMap.get(titleId)}
								<RewardRow icon={asset('/assets/rewards/Title_icon.png')} alt="title">
									<span>{$_('achievements.achievement_is_title')}</span>
									{#if title?.name}
										<Linkable link={helperUtils.wikiLink(title.name)} rel="noopener noreferrer">{title.name}</Linkable>
									{:else}
										<span>{$_('achievements.reward_title_with_id', { id: reward.id })}</span>
									{/if}
								</RewardRow>
							{/each}
						{:else if rewards.title}
							<RewardRow icon={asset('/assets/rewards/Title_icon.png')} alt="title">
								<span>{$_('achievements.achievement_is_title')}</span>
							</RewardRow>
						{/if}

						{#if itemRewards.length}
							<RewardRow className="reward-row-items" icon={asset('/assets/rewards/Achievement_Chest_interface_icon.png')} alt="item">
								<div class="reward-items-content">
									<span>{$_('achievements.achievement_is_item')}</span>
									<ul class="reward-items-list">
										{#each itemRewards as reward, idx (`item-${reward.id ?? idx}-${idx}`)}
											{@const itemId = Number(reward.id || 0)}
											{@const item = rewardItemsMap.get(itemId)}
											<li class="reward-item-entry">
												<div class="reward-item-preview">
													<Item
														item={{
															id: itemId,
															name: item?.name,
															icon: item?.icon,
															rarity: item?.rarity,
															count: reward.count || 1,
														}}
													/>
													<Linkable link={helperUtils.wikiLink(item?.name || `item ${itemId}`)} rel="noopener noreferrer">
														{item?.name || $_('achievements.reward_item_with_id', { id: reward.id, count: reward.count || 1 })}
													</Linkable>
												</div>
											</li>
										{/each}
									</ul>
								</div>
							</RewardRow>
						{:else if rewards.item}
							<RewardRow icon={asset('/assets/rewards/Achievement_Chest_interface_icon.png')} alt="item">
								<span>{$_('achievements.achievement_is_item')}</span>
							</RewardRow>
						{/if}

						{#if coinRewards.length}
							{#each coinRewards as reward, idx (`coins-${idx}`)}
								<RewardRow icon={asset('/assets/rewards/Gold_coin_highres.png')} alt="coins">
									<span>{$_('achievements.giving_gold')}</span>
									<Price value={reward.count || 0} />
								</RewardRow>
							{/each}
						{:else if rewards.coins?.length}
							<RewardRow icon={asset('/assets/rewards/Gold_coin_highres.png')} alt="coins">
								<span>{$_('achievements.giving_gold')}</span>
								<Price value={rewards.coins[0].count} />
							</RewardRow>
						{/if}

						{#if masteryRewards.length}
							{#each masteryRewards as reward, idx (`mastery-${reward.region ?? idx}-${idx}`)}
								<RewardRow icon={masteryIcon(reward.region)} alt="mastery">
									<span>{masteryText(reward.region)}</span>
								</RewardRow>
							{/each}
						{:else}
							{#if rewards.mastery?.find((x: MasteryReward) => x.region == 'Tyria')}
								<RewardRow icon={asset('/assets/rewards/Mastery_point_Central_Tyria.png')} alt="mastery Tyria">
									<span>{$_('achievements.achievement_is_mastery_tyria')}</span>
								</RewardRow>
							{/if}
							{#if rewards.mastery?.find((x: MasteryReward) => x.region == 'Maguuma')}
								<RewardRow icon={asset('/assets/rewards/Mastery_point_Heart_of_Thorns.png')} alt="mastery HoT">
									<span>{$_('achievements.achievement_is_mastery_hot')}</span>
								</RewardRow>
							{/if}
							{#if rewards.mastery?.find((x: MasteryReward) => x.region == 'Desert')}
								<RewardRow icon={asset('/assets/rewards/Mastery_point_Path_of_Fire.png')} alt="mastery PoF">
									<span>{$_('achievements.achievement_is_mastery_pof')}</span>
								</RewardRow>
							{/if}
							{#if rewards.mastery?.find((x: MasteryReward) => x.region == 'Tundra')}
								<RewardRow icon={asset('/assets/rewards/Mastery_point_Icebrood_Saga.png')} alt="mastery Icebrood">
									<span>{$_('achievements.achievement_is_mastery_ice')}</span>
								</RewardRow>
							{/if}
							{#if rewards.mastery?.find((x: MasteryReward) => x.region == 'Jade')}
								<RewardRow icon={asset('/assets/rewards/Mastery_point_End_of_Dragons.png')} alt="mastery EoD">
									<span>{$_('achievements.achievement_is_mastery_eod')}</span>
								</RewardRow>
							{/if}
							{#if rewards.mastery?.find((x: MasteryReward) => x.region == 'Sky')}
								<RewardRow icon={asset('/assets/rewards/Mastery_point_Secrets_of_the_Obscure.png')} alt="mastery SotO">
									<span>{$_('achievements.achievement_is_mastery_soto')}</span>
								</RewardRow>
							{/if}
							{#if rewards.mastery?.find((x: MasteryReward) => x.region == 'Unknown')}
								<RewardRow icon={asset('/assets/rewards/Mastery_point_Janthir_Wilds.png')} alt="mastery JW">
									<span>{$_('achievements.achievement_is_mastery_jw')}</span>
								</RewardRow>
							{/if}
						{/if}

						{#if pointsToGet > 0}
							<RewardRow className="ap-left" icon={asset('/assets/rewards/AP.png')} alt="AP">
								<span>{$_('achievements.achievement_can_get', { pointsToGet })}</span>
							</RewardRow>
						{/if}

						{#if max}
							<RewardRow icon={asset('/assets/rewards/Achievements_Summary.png')} alt="progress">
								<span>{$_('achievements.exact_progress', { current: Math.min(current, max), max })}</span>
							</RewardRow>
						{/if}
					</ul>

					{#if prerequisites.length}
						<h4>{$_('achievements.prerequisites')}</h4>
						<ul class="meta-list prerequisites-list">
							{#each prerequisites as req, idx (`prereq-${req.id}-${idx}`)}
								<li class="prerequisite-item">
									<img
										src={asset(req.done ? '/assets/rewards/map_heart_full.png' : '/assets/rewards/map_heart_empty.png')}
										alt={req.done ? 'completed prerequisite' : 'not completed prerequisite'}
									/>
									<a href={resolve(`/achievements/${req.id}/`)}>
										{req.name || $_('achievements.prerequisite_achievement_with_id', { id: req.id })}
									</a>
								</li>
							{/each}
						</ul>
					{/if}
				</section>
			{/if}

			{#if hasProgressSection}
				<section class="details-card progress-section grunge-border">
					<h3>{$_('achievements.detailed_progress')}</h3>
					{#if bits.length}
						<AchievementProgress
							type={String(achiev.type || 'Default')}
							{bits}
							{bitsDone}
							done={Boolean(achiev.done)}
							detailed={true}
							itemsCache={apiService.itemsCache as (id: number) => { name?: string; icon?: string }}
							minisCache={apiService.minisCache as (id: number) => { name?: string; icon?: string }}
							skinsCache={apiService.skinsCache as (id: number) => { name?: string; icon?: string }}
						/>
					{/if}
				</section>
			{/if}

			{#if tiers.length}
				<section class="details-card tier-section grunge-border">
					<h3>{$_('achievements.tier_progress')}</h3>
					<ul class="tiers">
						{#each tiers as tier, idx (tier.count + '-' + idx)}
							<li class:done={tierDone(current, Number(tier.count || 0))}>
								<span>{$_('achievements.tier_target', { count: tier.count })}</span>
								{#if tier.points}
									<ul>
										<li class="reward-row ap-left">
											<span>+{tier.points}</span>
											<img src={asset('/assets/rewards/AP.png')} alt="AP" />
										</li>
									</ul>
								{/if}
							</li>
						{/each}
					</ul>
				</section>
			{/if}
		</div>
	</section>
{/if}

<style lang="scss">
	.achiev-details-page {
		display: flex;
		flex-flow: column nowrap;
		gap: 1em;
	}

	.page-head {
		display: flex;
		flex-flow: column nowrap;
		gap: 0.4em;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.45em;

		img {
			width: 1.3em;
			height: 1.3em;
			object-fit: contain;
		}
	}

	.details-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.8em;
	}

	.details-card {
		display: flex;
		flex-flow: column nowrap;
		gap: 0.8em;
		padding: 0.8em;
		background: var(--gw2helper-module);
		border-radius: 0.3125em;
	}

	.reward-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-flow: column nowrap;
		gap: 0.5em;
	}

	.reward-row {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5em;

		> img {
			width: 1.4em;
			height: 1.4em;
			object-fit: contain;
		}

		span {
			font-size: 0.95em;
		}
	}

	.reward-item-preview {
		display: inline-flex;
		align-items: center;
		gap: 0.5em;

		:global(a) {
			font-size: 0.95em;
		}
	}

	.reward-items-content {
		display: flex;
		flex-flow: column nowrap;
		gap: 0.35em;
	}

	.reward-items-list {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-flow: column nowrap;
		gap: 0.35em;
	}

	.reward-item-entry {
		margin: 0;
		padding: 0;
	}

	.meta-list {
		list-style: disc;
		margin: 0;
		padding: 0 0 0 1.2em;
		display: flex;
		flex-flow: column nowrap;
		gap: 0.35em;

		li {
			font-size: 0.92em;
			line-height: 1.3;
		}
	}

	.prerequisites-list {
		list-style: none;
		padding: 0;

		.prerequisite-item {
			display: flex;
			align-items: center;
			gap: 0.5em;

			img {
				width: 1em;
				height: 1em;
				object-fit: contain;
			}
		}
	}

	h4 {
		margin: 0.6em 0 0.2em;
		font-size: 0.95em;
	}

	a {
		color: var(--gw2helper-module-text);
	}

	.tiers {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-flow: column nowrap;
		gap: 0.3em;

		li {
			display: flex;
			justify-content: space-between;
			gap: 1em;
			padding: 0.3em 0.5em;
			background: color-mix(in srgb, var(--gw2helper-module-white) 60%, transparent);
		}

		li.done {
			text-decoration: line-through;
			opacity: 0.8;
		}
	}

	@media (min-width: 900px) {
		.details-grid {
			grid-template-columns: repeat(2, minmax(0, 1fr));
		}

		.rewards-breakdown {
			grid-column: 1 / -1;
		}
	}
</style>
