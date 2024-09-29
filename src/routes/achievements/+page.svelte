<script>
	import helperUtils from '$lib/utils/helper-utils';
	import SearchInput from '$lib/components/searchInput.svelte';
	import Awaiter from '$lib/components/awaiter.svelte';
	import WidgetInfo from '$lib/components/widgets/widgetInfo.svelte';
	import WidgetsGroup from '$lib/components/widgets/widgetsGroup.svelte';
	import { sum } from '$lib/utils';
	import utils from '$lib/utils';
	import { base } from '$app/paths';
	import Price from '$lib/components/price.svelte';
	import { onMount } from 'svelte';
	import { Tabs, TabPanel, Tab } from '$lib/components/tabs/tabs.js';
	import AchievList from '$lib/components/achievements/achievList.svelte';
	import AchievGroup from '$lib/components/achievements/achievGroup.svelte';
	import { sort, filteredAchieves } from '$lib/components/achievements/achieves.js';
	import { _ } from '$lib/localizer.js';

	export let data;

	let filter = '';
	let todoList = [];
	let showApiLinks = false;

	let notCompleted = true;
	let withPoints = false;
	let withMasteryCentral = false;
	let withMasteryHoT = false;
	let withMasteryPoF = false;
	let withMasteryIce = false;
	let withMasteryEoD = false;
	let withMasterySofO = false;
	let withMasteryJW = false;
	let withTitles = false;
	let withItems = false;
	let withCoins = false;
	let daily = false;
	let weekly = false;
	let sortBy = 'ap';

	onMount(async () => {
		showApiLinks = utils.getQueryStringFlag('show-api-links');
		const settings = await data.settings;
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

		todoList = await data.todo;
		// console.log('todo', todoList);
	});

	function achievFilterCallback(achiev) {
		const mastery = achiev.rewardsObj.mastery || [];
		const notCompletedOK = !notCompleted || !achiev.done;
		const withPointsOK = !withPoints || achiev.points_to_get > 0;
		const withTitlesOK = !withTitles || achiev.rewardsObj.title;
		const withItemsOK = !withItems || achiev.rewardsObj.item;
		const withCoinsOK = !withCoins || achiev.rewardsObj.coins;
		const dailyWeeklyOK = (!daily && !weekly) || (daily && achiev.flags.includes('Daily')) || (weekly && achiev.flags.includes('Weekly'));
		const requiredRegions = [];
		if (withMasteryCentral) requiredRegions.push('Tyria');
		if (withMasteryHoT) requiredRegions.push('Maguuma');
		if (withMasteryPoF) requiredRegions.push('Desert');
		if (withMasteryIce) requiredRegions.push('Tundra');
		if (withMasteryEoD) requiredRegions.push('Jade');
		if (withMasterySofO) requiredRegions.push('Sky');
		if (withMasteryJW) requiredRegions.push('Unknown');

		const withMasteryOK = !requiredRegions.length || mastery.find((x) => requiredRegions.includes(x.region));

		const filterOK = helperUtils.fullTextSearch(filter, achiev, ['name', 'desription', 'requirement']);

		const achiev_res = notCompletedOK && withPointsOK && withTitlesOK && withItemsOK && withCoinsOK && withMasteryOK && dailyWeeklyOK && filterOK;

		// if (item.id == 75) {
		// 	console.log(`  ${achiev.name}`, { achiev_res, notCompletedOK, withPointsOK, withMasteryOK, filterOK });
		// }
		return achiev_res;
	}

	function saveSettings() {
		utils.saveAchievesSettings({
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

	async function hndToggleTodo(event) {
		const obj = event.detail;
		if (obj.todo) {
			todoList.push(obj.id);
			todoList = todoList;
		} else {
			todoList = todoList.filter((x) => x !== obj.id);
		}
		await utils.saveAchievesToDo(todoList);
	}

	function expandToDoList(all, list) {
		const api = data.apiService;
		const _data = [];

		all.categories.forEach((cat) => {
			cat.achievements.forEach((x) => {
				if (list.includes(x.id)) {
					_data.push({ ...x, todo: true });
				}
			});
		});
		// console.log('expanded', _data)
		return _data;
	}
</script>

<h1>{ $_('achievements.achievements') }</h1>

<Awaiter promise={data.achievements} let:result>
	{@const _result = filteredAchieves(result, filter, achievFilterCallback, null, [
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
	])}
	<WidgetsGroup name={$_('achievements.achievements_completed')}>
		<WidgetInfo title="{ $_('achievements.achieves_completed') }" value={result.completed} image={`${base}/assets/rewards/Monthly_Achievement.png`} />
		<WidgetInfo title="{ $_('achievements.daily_points') }" value={result.daily_ap} image={`${base}/assets/rewards/AP.png`} />
		<WidgetInfo title="{ $_('achievements.monthly_points') }" value={result.monthly_ap} image={`${base}/assets/rewards/AP.png`} />
		<WidgetInfo title="{ $_('achievements.points_from_achieves') }" value={sum(result.categories, 'points_done')} image={`${base}/assets/rewards/AP.png`} />
		<!-- <WidgetInfo title="Points total" value={result.monthly_ap + result.daily_ap + sum(result.categories, 'points_done')} image={`${base}/assets/rewards/AP.png`} /> -->
	</WidgetsGroup>
	<WidgetsGroup name={$_('achievements.achievements_todo')}>
		<WidgetInfo title="{ $_('achievements.achieves_to_do') }" value={result.todo} image="{base}/assets/rewards/Daily_Achievement.png" />
		<WidgetInfo title="{ $_('achievements.points_to_get') }" value={sum(result.categories, 'points_to_get')} image="{base}/assets/rewards/AP.png" />
		<WidgetInfo title="{ $_('achievements.titles_to_get') }" value={result.rewards_to_get.get('title')} image="{base}/assets/rewards/Talk_collection_option.png" />
		<WidgetInfo title="{ $_('achievements.items_to_get') }" value={result.rewards_to_get.get('item')} image="{base}/assets/rewards/Achievement_Chest_interface_icon.png" />
		<WidgetInfo title="{ $_('achievements.gold_to_get') }" value={result.rewards_to_get.get('coins')} image="{base}/assets/rewards/Merchant_crop.png" let:value>
			<Price {value} />
		</WidgetInfo>
	</WidgetsGroup>

	<section class="tabs-container">
		<Tabs>
			<div class="tab-list">
				<Tab>{ $_('achievements.list') }</Tab>
				<Tab>{ $_('achievements.to_dos') }</Tab>
			</div>

			<TabPanel>
				<fieldset class="settings">
					<legend>{$_('common.settings')}</legend>

					<label><input type="checkbox" bind:checked={notCompleted} /> { $_('achievements.not_completed') }</label>
					<label><input type="checkbox" bind:checked={withPoints} /> { $_('achievements.giving_points') }</label>
					<label><input type="checkbox" bind:checked={withMasteryCentral} /> { $_('achievements.central_tyria_mastery') }</label>
					<label><input type="checkbox" bind:checked={withMasteryHoT} /> { $_('achievements.hot_mastery') }</label>
					<label><input type="checkbox" bind:checked={withMasteryPoF} /> { $_('achievements.pof_mastery') }</label>
					<label><input type="checkbox" bind:checked={withMasteryIce} /> { $_('achievements.icebrood_saga_mastery') }</label>
					<label><input type="checkbox" bind:checked={withMasteryEoD} /> { $_('achievements.eod_mastery') }</label>
					<label><input type="checkbox" bind:checked={withMasterySofO} /> { $_('achievements.sofo_mastery') }</label>
					<label><input type="checkbox" bind:checked={withMasteryJW} /> { $_('achievements.janthir_wilds_mastery') }</label>
					<label><input type="checkbox" bind:checked={withTitles} /> { $_('achievements.giving_titles') }</label>
					<label><input type="checkbox" bind:checked={withItems} /> { $_('achievements.giving_items') }</label>
					<label><input type="checkbox" bind:checked={withCoins} /> { $_('achievements.giving_gold') }</label>
					<label><input type="checkbox" bind:checked={daily} /> { $_('achievements.daily') }</label>
					<label><input type="checkbox" bind:checked={weekly} /> { $_('achievements.weekly') }</label>

					<div class="group">
						<label><input type="radio" name="sort" value="ap" bind:group={sortBy} /> { $_('achievements.sort_by_points') }</label>
						<label><input type="radio" name="sort" value="name" bind:group={sortBy} /> { $_('achievements.sort_by_name') }</label>
						<label><input type="radio" name="sort" value="order" bind:group={sortBy} /> { $_('achievements.sort_by_in_game_order')}</label>
					</div>

					<button on:click={saveSettings}>{$_('common.save_settings')}</button>
				</fieldset>

				<section>
					<SearchInput bind:value={filter} name="filter" id="filter" placeholder={$_('common.too_much_data')} />
				</section>

				<span>{ $_('achievements.showing_out_of', { shown: _result.categories.length, total: result.categories.length} ) }</span>
				<div class="achiev-container masked" style="mask-position: {Math.trunc(Math.random() * 1000)}px bottom;">
					{#each sort(_result.categories, sortBy) as category (category.id)}
						<AchievGroup {category} {showApiLinks} {sortBy} on:toggle-todo={hndToggleTodo} />
					{/each}
				</div>
			</TabPanel>

			<TabPanel>
				<h2>{ $_('achievements.your_list') }</h2>
				<AchievList items={expandToDoList(result, todoList)} {todoList} on:toggle-todo={hndToggleTodo}>
					{@html $_('achievements.empty_list', {img_url: `${base}/assets/rewards/map_heart_empty.png`}) } 
				</AchievList>
			</TabPanel>
		</Tabs>
	</section>
</Awaiter>

<style lang="scss">
	.tabs-container {
		margin-top: 4em;
	}
</style>
