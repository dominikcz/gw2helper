<script>
	import helperUtils from '$lib/utils/helper-utils';
	import SearchInput from '$lib/components/searchInput.svelte';
	import Awaiter from '$lib/components/awaiter.svelte';
	import WidgetInfo from '$lib/components/widgetInfo.svelte';
	import WidgetsGroup from '$lib/components/widgetsGroup.svelte';
	import { sum } from '$lib/utils';
	import { base } from '$app/paths';
	export let data;

	let filter = '';
	const fields = ['name', 'description'];
</script>

<img src="/gw2helper/assets/150px-construction.png" title="Under constrution" width="150px" alt="under construction" />

<h1>Achievements</h1>

<!-- https://api.guildwars2.com/v2/achievements?ids=1840,910,2258 -->

<!-- id - The achievement id.
icon (string, optional) – The achievement icon.
name (string) – The achievement name.
description (string) – The achievement description.
requirement (string) – The achievement requirement as listed in-game.
locked_text (string) – The achievement description prior to unlocking it.
type (string) – The achievement type. Possible values:
    Default - A default achievement.
    ItemSet - Achievement is linked to Collections
flags (array of strings) - Achievement categories. Possible values:
    Pvp - can only get progress in PvP or WvW
    CategoryDisplay - is a meta achievement
    MoveToTop - affects in-game UI collation
    IgnoreNearlyComplete - doesn't appear in the "nearly complete" UI
    Repeatable - can be repeated multiple times
    Hidden - hidden achievement; must fulfil unlock requirements before making progress or showing in the hero panel
    RequiresUnlock - must fulfil unlock requirements before making progress but will show in the hero panel before unlocking
    RepairOnLogin - unknown
    Daily - Flags an achievement as resetting daily.
    Weekly - Flags an achievement as resetting weekly.
    Monthly - Flags an achievement as resetting monthly.
    Permanent - Flags an achievement as progress never reseting.
tiers (array of objects) - Describes the achievement's tiers. Each object contains:
    count (number) - The number of "things" (achievement-specific) that must be completed to achieve this tier.
    points (number) The amount of AP awarded for completing this tier.
prerequisites (array of numbers) (optional) - Contains an array of achievement ids required to progress the given achievement.
rewards (array of objects, optional) - Describes the rewards given for the achievement. Each object contains:
    type (string) - The type of reward. Additional fields appear for different values of type.
        If Coins:
            count (number) - The number of Coins to be rewarded.
        If Item:
            id (number) - The item ID to be rewarded.
            count (number) - The number of id to be rewarded.
        If Mastery:
            id (number) - The mastery point ID to be rewarded.
            region (string) - The region the Mastery Point applies to. Either Tyria, Maguuma, Desert or Tundra.
        If Title:
            id (number) - The title id.
bits (array of objects, optional) - Contains a number of objects, each corresponding to a bitmask value that can give further information on the progress towards the achievement. Each object has the following values:
    type (string) - The type of bit. Can be Text, Item, Minipet, or Skin.
    id (number, optional) - The ID of the item, mini, or skin, if applicable.
    text (string, optional) - The text for the bit, if type is Text.
point_cap (number, optional) - The maximum number of AP that can be rewarded by an achievement flagged as Repeatable. -->

<section>
	<label for="filter">Filter:</label>
	<SearchInput bind:value={filter} name="filter" id="filter" placeholder="too much data?" />
</section>

<Awaiter promise={data.achievements} let:result>
	<WidgetsGroup name="Achievements' summary">
		<WidgetInfo title="completed" value={result.completed} />
		<WidgetInfo title="to do" value={result.todo} />
	</WidgetsGroup>
	<div class="achiev-container">
		{#each result.categories as category (category.id)}
			<details class="achiev-group">
				<summary>
					<img src={category.icon} alt={category.name} />
					<div class="descr">
						<span>{category.name}</span>
						<div class="rewards">
							{#if category.rewards.title}
								<div class="reward-item">
									<img src="{base}/assets/rewards/Talk_collection_option.png" alt="title" />
								</div>
							{/if}
							{#if category.rewards.coins}
								<div class="reward-item">
									<img src="{base}/assets/rewards/Gold_coin_(highres).png" alt="gold" />
								</div>
							{/if}
							{#if category.rewards.item}
								<div class="reward-item">
									<img src="{base}/assets/rewards/Achievement_Chest_(interface_icon).png" alt="item" />
								</div>
							{/if}
							{#if category.rewards.mastery}
								{#if category.rewards.mastery.find((x) => x.region == 'Tyria')}
									<div class="reward-item">
										<img src="{base}/assets/rewards/Mastery_point_(Central_Tyria).png" alt="mastery points Central Tyria" />
									</div>
								{/if}
								{#if category.rewards.mastery.find((x) => x.region == 'Maguuma')}
									<div class="reward-item">
										<img src="{base}/assets/rewards/Mastery_point_(Heart_of_Thorns).png" alt="mastery points Heart of Thorns" />
									</div>
								{/if}
								{#if category.rewards.mastery.find((x) => x.region == 'Desert')}
									<div class="reward-item">
										<img src="{base}/assets/rewards/Mastery_point_(Path_of_Fire).png" alt="mastery points Path of Fire" />
									</div>
								{/if}
								{#if category.rewards.mastery.find((x) => x.region == 'Tundra')}
									<div class="reward-item">
										<img src="{base}/assets/rewards/Mastery_point_(Icebrood_Saga).png" alt="mastery points Icebrood Saga" />
									</div>
								{/if}
								{#if category.rewards.mastery.find((x) => x.region == 'Jade')}
									<div class="reward-item">
										<img src="{base}/assets/rewards/Mastery_point_(End_of_Dragons).png" alt="mastery points End of Dragons" />
									</div>
								{/if}
								{#if category.rewards.mastery.find((x) => x.region == 'Sky')}
									<div class="reward-item">
										<img
											src="{base}/assets/rewards/Mastery_point_(Secrets_of_the_Obscure).png"
											alt="mastery points Secrets of the Obscure"
										/>
									</div>
								{/if}
							{/if}
							{#if category.points_to_get}
								<div class="reward-item">
									<span>{category.points_to_get}</span>
									<img src="{base}/assets/rewards/AP.png" alt="achievement points" />
								</div>
							{/if}
							<div class="reward-item">
								<span>{category.achievements.length}</span>
								<img src="{base}/assets/rewards/Achievements_Summary.png" alt="achieves" />
							</div>
						</div>
					</div>
				</summary>
				{#if category.description}<p>{category.description}</p>{/if}
				<div class="achiev-list">
					{#each helperUtils.filterCollection(category.achievements, fields, filter) as achiev (achiev.id)}
						<div class="achiev">
							{#if achiev.icon}<img src={achiev.icon} alt={achiev.name} />{/if}
							<h3>{achiev.name} <small>({achiev.id})</small></h3>
							{#if achiev.description}<span>{achiev.description}</span>{/if}
							{#if achiev.type != 'Default'}<div>{achiev.type}</div>{/if}
							{#if achiev.tiers}<div>TIERS: {JSON.stringify(achiev.tiers)}</div>{/if}
							{#if achiev.rewards}<div>REWARDS: {JSON.stringify(achiev.rewards)}</div>{/if}
							{#if achiev.point_cap}<div>{achiev.point_cap}</div>{/if}
							{#if achiev.bits}<div>BITS: {JSON.stringify(achiev.bits)}</div>{/if}
							{#if achiev.bits_done}<div>BITS_DONE: {JSON.stringify(achiev.bits_done)}</div>{/if}
							{#if achiev.current}<div>{achiev.current} / {achiev.max}</div>{/if}
							{achiev.tier_points_total},
							{achiev.tier_points_done},
							{achiev.tier_points_to_get},
						</div>
					{/each}
				</div>
			</details>
		{/each}
	</div>
</Awaiter>

<style lang="scss">
	.achiev-container {
		display: flex;
		flex-flow: column nowrap;
		gap: 1rem;
		margin: 0 0 1rem 0;
	}
	.achiev-group {
		display: flex;
		flex-flow: column wrap;
		gap: 1rem;
		margin: 0;
		background-color: var(--gw2helper-module);
		summary {
            padding: 0.4rem 0.4rem;
			display: flex;
			flex-flow: row nowrap;
			justify-content: flex-start;
			align-items: center;
            gap: 0.6rem;
            &::before {
					content: '\25b6';
					transition: 0.2s;
				}

			.descr {
				display: flex;
				flex-flow: column nowrap;
                justify-content: flex-start;
				align-items: flex-start;
				gap: 0.6rem;
                width: 100%;
			}
		}
		&[open] summary::before {
			transform: rotate(90deg);
		}
		img {
			width: 48px;
			height: 48px;
		}
	}
	.achiev {
		display: flex;
		flex-flow: column nowrap;
		background-color: var(--gw2helper-module);
		padding: 0.5rem;
		gap: 0.2rem;
		img {
			width: 48px;
			height: 48px;
		}
	}

	.rewards {
        width: 100%;
		display: flex;
		flex-flow: row wrap;
		align-items: center;
        justify-content: flex-end;
		column-gap: 1rem;
		row-gap: 0.2rem;
	}

	.reward-item {
		display: flex;
		flex-flow: row nowrap;
		align-items: center;
		span {
			font-size: large;
		}
		img {
			width: 24px;
			height: 24px;
			object-fit: contain;
		}
	}
</style>
