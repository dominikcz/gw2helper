<script lang="ts">
	import helperUtils from '$lib/utils/helper-utils';
	import SearchInput from '$lib/components/searchInput.svelte';
	import Awaiter from '$lib/components/awaiter.svelte';
	import WidgetInfo from '$lib/components/widgets/widgetInfo.svelte';
	import WidgetsGroup from '$lib/components/widgets/widgetsGroup.svelte';
	import { sum } from '$lib/utils';
	import utils from '$lib/utils';
	import { asset } from '$app/paths';
	import Price from '$lib/components/price.svelte';
	import { onMount } from 'svelte';
	import { Tabs, TabPanel, Tab } from '$lib/components/tabs/tabs';
	import AchievList from '$lib/components/achievements/achievList.svelte';
	import AchievGroup from '$lib/components/achievements/achievGroup.svelte';
	import { sort, filteredAchievements, expandToDoList } from '$lib/components/achievements/achievements';
	import { t as _ } from '$lib/services/i18n';
	import { grungeBorder } from '$lib/actions/grungeBorder';

	/** @type {{data: any}} */
	let { data } = $props();

	let filter = $state('');
	let showApiLinks = $state(false);

	let notCompleted = $state(true);
	let withPoints = $state(false);
	let withMasteryCentral = $state(false);
	let withMasteryHoT = $state(false);
	let withMasteryPoF = $state(false);
	let withMasteryIce = $state(false);
	let withMasteryEoD = $state(false);
	let withMasterySofO = $state(false);
	let withMasteryJW = $state(false);
	let withTitles = $state(false);
	let withItems = $state(false);
	let withCoins = $state(false);
	let daily = $state(false);
	let weekly = $state(false);
	let sortBy = $state('ap');
	let todoList=$state([]);

	type MasteryReward = { region: string };
	type AchievementLike = {
		id?: number;
		done?: boolean;
		flags?: string[];
		points_to_get?: number;
		rewardsObj?: {
			mastery?: MasteryReward[];
			title?: unknown;
			item?: unknown;
			coins?: unknown;
		};
		name?: string;
		desription?: string;
		requirement?: string;
	};

	onMount(async () => {
		showApiLinks = utils.getQueryStringFlag('show-api-links');
		const settings = await data.settings as Record<string, any>;
		if (settings.notCompleted !== undefined) notCompleted = settings.notCompleted;
		if (settings.withPoints !== undefined) withPoints = settings.withPoints;
		if (settings.withMasteryCentral !== undefined) withMasteryCentral = settings.withMasteryCentral;
		if (settings.withMasteryHoT !== undefined) withMasteryHoT = settings.withMasteryHoT;
		if (settings.withMasteryPoF !== undefined) withMasteryPoF = settings.withMasteryPoF;
		if (settings.withMasteryIce !== undefined) withMasteryIce = settings.withMasteryIce;
		if (settings.withMasteryEoD !== undefined) withMasteryEoD = settings.withMasteryEoD;
		if (settings.withMasterySofO !== undefined) withMasterySofO = settings.withMasterySofO;
		if (settings.withMasteryJW !== undefined) withMasteryJW = settings.withMasteryJW;
		if (settings.withTitles !== undefined) withTitles = settings.withTitles;
		if (settings.withItems !== undefined) withItems = settings.withItems;
		if (settings.withCoins !== undefined) withCoins = settings.withCoins;
		if (settings.daily !== undefined) daily = settings.daily;
		if (settings.weekly !== undefined) weekly = settings.weekly;
		if (settings.sortBy !== undefined) sortBy = settings.sortBy;

		todoList = await data.toDoList;
		// console.log('todo', todoList);
	});

	function achievFilterCallback(achiev: AchievementLike) {
		const rewardsObj = achiev.rewardsObj ?? {};
		const mastery = rewardsObj.mastery || [];
		const notCompletedOK = !notCompleted || !achiev.done;
		const withPointsOK = !withPoints || (achiev.points_to_get ?? 0) > 0;
		const withTitlesOK = !withTitles || !!rewardsObj.title;
		const withItemsOK = !withItems || !!rewardsObj.item;
		const withCoinsOK = !withCoins || !!rewardsObj.coins;
		const flags = achiev.flags ?? [];
		const dailyWeeklyOK = (!daily && !weekly) || (daily && flags.includes('Daily')) || (weekly && flags.includes('Weekly'));
		const requiredRegions: string[] = [];
		if (withMasteryCentral) requiredRegions.push('Tyria');
		if (withMasteryHoT) requiredRegions.push('Maguuma');
		if (withMasteryPoF) requiredRegions.push('Desert');
		if (withMasteryIce) requiredRegions.push('Tundra');
		if (withMasteryEoD) requiredRegions.push('Jade');
		if (withMasterySofO) requiredRegions.push('Sky');
		if (withMasteryJW) requiredRegions.push('Unknown');

		const withMasteryOK = !requiredRegions.length || !!mastery.find((x: MasteryReward) => requiredRegions.includes(x.region));

		const filterOK = helperUtils.fullTextSearch(filter, achiev, ['name', 'desription', 'requirement', 'id']);

		const achiev_res = notCompletedOK && withPointsOK && withTitlesOK && withItemsOK && withCoinsOK && withMasteryOK && dailyWeeklyOK && filterOK;

		// if (item.id == 75) {
		// 	console.log(`  ${achiev.name}`, { achiev_res, notCompletedOK, withPointsOK, withMasteryOK, filterOK });
		// }
		return achiev_res;
	}

	function saveSettings() {
		utils.saveAchievementsSettings({
			notCompleted,
			withPoints,
			withMasteryCentral,
			withMasteryHoT,
			withMasteryPoF,
			withMasteryIce,
			withMasteryEoD,
			withMasterySofO,
			withMasteryJW,
			withTitles,
			withItems,
			withCoins,
			daily,
			weekly,
			sortBy,
		});
	}

</script>

<h1>{$_('achievements.achievements')}</h1>

<img src={asset('/assets/150px-construction.png')} title={$_('common.under_construction')} width="150px" alt="under construction" />

<Awaiter promise={data.achievements}>
	{#snippet children(result: any)}
		{@const typedResult = result as any}
		{@const _result = filteredAchievements(typedResult, filter, achievFilterCallback, null, {
			notCompleted,
			withPoints,
			withMasteryCentral,
			withMasteryHoT,
			withMasteryPoF,
			withMasteryIce,
			withMasteryEoD,
			withMasterySofO,
			withMasteryJW,
			withTitles,
			withItems,
			withCoins,
			daily,
			weekly,
		}) as any}
		{@const myItems = expandToDoList(_result, todoList)}
		<WidgetsGroup name={$_('achievements.achievements_completed')}>
			<WidgetInfo title={$_('achievements.achievements_completed')} value={typedResult.completed} image={asset('/assets/rewards/Monthly_Achievement.png')} />
			<WidgetInfo title={$_('achievements.daily_points')} value={typedResult.daily_ap} image={asset('/assets/rewards/AP.png')} />
			<WidgetInfo title={$_('achievements.monthly_points')} value={typedResult.monthly_ap} image={asset('/assets/rewards/AP.png')} />
			<WidgetInfo
				title={$_('achievements.points_from_achievements')}
				value={String(sum(typedResult.categories, 'points_done'))}
				image={asset('/assets/rewards/AP.png')}
			/>
			<!-- <WidgetInfo title="Points total" value={result.monthly_ap + result.daily_ap + sum(result.categories, 'points_done')} image={resolve('/assets/rewards/AP.png')} /> -->
		</WidgetsGroup>
		<WidgetsGroup name={$_('achievements.achievements_todo')}>
			<WidgetInfo title={$_('achievements.achievements_to_do')} value={String(typedResult.todo)} image={asset('/assets/rewards/Daily_Achievement.png')} />
			<WidgetInfo title={$_('achievements.points_to_get')} value={String(sum(typedResult.categories, 'points_to_get'))} image={asset('/assets/rewards/AP.png')} />
			<WidgetInfo
				title={$_('achievements.titles_to_get')}
				value={typedResult.rewards_to_get.get('title')}
				image={asset('/assets/rewards/Talk_collection_option.png')}
			/>
			<WidgetInfo
				title={$_('achievements.items_to_get')}
				value={typedResult.rewards_to_get.get('item')}
				image={asset('/assets/rewards/Achievement_Chest_interface_icon.png')}
			/>
			<WidgetInfo title={$_('achievements.gold_to_get')} value={typedResult.rewards_to_get.get('coins')} image={asset('/assets/rewards/Merchant_crop.png')}>
				{#snippet children({ value })}
					<Price {value} />
				{/snippet}
			</WidgetInfo>
		</WidgetsGroup>

		<section class="tabs-container">
			<Tabs>
				<div class="tab-list">
					<Tab>{$_('achievements.list')}</Tab>
					<Tab>{$_('achievements.to_dos')}</Tab>
				</div>

				<TabPanel>
					<fieldset class="settings">
						<legend>{$_('common.settings')}</legend>

						<label><input type="checkbox" bind:checked={notCompleted} /> {$_('achievements.not_completed')}</label>
						<label><input type="checkbox" bind:checked={withPoints} /> {$_('achievements.giving_points')}</label>
						<label><input type="checkbox" bind:checked={withMasteryCentral} /> {$_('achievements.central_tyria_mastery')}</label>
						<label><input type="checkbox" bind:checked={withMasteryHoT} /> {$_('achievements.hot_mastery')}</label>
						<label><input type="checkbox" bind:checked={withMasteryPoF} /> {$_('achievements.pof_mastery')}</label>
						<label><input type="checkbox" bind:checked={withMasteryIce} /> {$_('achievements.icebrood_saga_mastery')}</label>
						<label><input type="checkbox" bind:checked={withMasteryEoD} /> {$_('achievements.eod_mastery')}</label>
						<label><input type="checkbox" bind:checked={withMasterySofO} /> {$_('achievements.sofo_mastery')}</label>
						<label><input type="checkbox" bind:checked={withMasteryJW} /> {$_('achievements.janthir_wilds_mastery')}</label>
						<label><input type="checkbox" bind:checked={withTitles} /> {$_('achievements.giving_titles')}</label>
						<label><input type="checkbox" bind:checked={withItems} /> {$_('achievements.giving_items')}</label>
						<label><input type="checkbox" bind:checked={withCoins} /> {$_('achievements.giving_gold')}</label>
						<label><input type="checkbox" bind:checked={daily} /> {$_('achievements.daily')}</label>
						<label><input type="checkbox" bind:checked={weekly} /> {$_('achievements.weekly')}</label>

						<div class="group">
							<label><input type="radio" name="sort" value="ap" bind:group={sortBy} /> {$_('achievements.sort_by_points')}</label>
							<label><input type="radio" name="sort" value="name" bind:group={sortBy} /> {$_('achievements.sort_by_name')}</label>
							<label><input type="radio" name="sort" value="order" bind:group={sortBy} /> {$_('achievements.sort_by_in_game_order')}</label>
						</div>

						<button onclick={saveSettings}>{$_('common.save_settings')}</button>
					</fieldset>

					<section>
						<SearchInput bind:value={filter} name="filter" id="filter" placeholder={$_('common.too_much_data')} />
					</section>

					<span>{$_('achievements.showing_out_of', { shown: _result.categories.length, total: typedResult.categories.length })}</span>
					<div class="achiev-container" use:grungeBorder>
						{#each sort(_result.categories as import('$lib/components/achievements/achievements').CategoryLike[], sortBy) as category (category.id)}
							<AchievGroup {category} {showApiLinks} {sortBy} {todoList} onToggleTodo={(event: { id: number; todo: boolean }) => utils.hndToggleTodo(event, todoList)} />
						{/each}
					</div>
				</TabPanel>

				<TabPanel>
					<h2>{$_('achievements.your_list')}</h2>
					<AchievList items={myItems} {todoList} onToggleTodo={(event: { id: number; todo: boolean }) => utils.hndToggleTodo(event, todoList)}>
						{@html $_('achievements.empty_list', { img_url: asset('/assets/rewards/map_heart_empty.png') })}
					</AchievList>
				</TabPanel>
			</Tabs>
		</section>
	{/snippet}
</Awaiter>

<style lang="scss">
	.tabs-container {
		margin-top: 4em;
	}
</style>
