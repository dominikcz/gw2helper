<script lang="ts">
	import helperUtils from '$lib/utils/helper-utils';
	import SearchInput from '$lib/components/search/searchInput.svelte';
	import Awaiter from '$lib/components/ui/awaiter.svelte';
	import WidgetInfo from '$lib/components/widgets/widgetInfo.svelte';
	import WidgetsGroup from '$lib/components/widgets/widgetsGroup.svelte';
	import { sum } from '$lib/utils';
	import utils from '$lib/utils';
	import { asset } from '$app/paths';
	import Price from '$lib/components/currencies/price.svelte';
	import { onMount } from 'svelte';
	import { Tabs, TabPanel, Tab } from '$lib/components/tabs/tabs';
	import AchievList from '$lib/components/achievements/achievList.svelte';
	import AchievGroup from '$lib/components/achievements/achievGroup.svelte';
	import { sort, filteredAchievements, expandToDoList } from '$lib/components/achievements/achievements';
	import AchievementFilters from '$lib/components/achievements/achievementFilters.svelte';
	import { defaultFilters, applySettings } from '$lib/components/achievements/achievementFiltersUtils';
	import { t as _ } from '$lib/services/i18n';
	import { grungeBorder } from '$lib/actions/grungeBorder';
	import todoList from '$lib/services/todoList.svelte';
	import type { PageData } from './$types';
	import type { AchievementSettings } from '$lib/utils';
	import type { AchievementsData } from '$lib/components/achievements/achievements';

	type AchievementsView = AchievementsData & { rewards_to_get: Map<string, number> };

	let { data }: { data: PageData } = $props();

	let filter = $state('');
	let showApiLinks = $state(false);
	let filters = $state({ ...defaultFilters });

	type MasteryReward = { region: string };
	type AchievementLike = {
		id?: number;
		done?: boolean;
		flags?: string[];
		points_to_get?: number;
		current?: number;
		max?: number;
		bits?: unknown[];
		bits_done?: number[];
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
	type TodoSortBy = 'ap' | 'progress' | 'manual';
	let todoSortBy = $state<TodoSortBy>('ap');

	onMount(async () => {
		showApiLinks = utils.getQueryStringFlag('show-api-links');
		const settings = await data.settings as AchievementSettings;
		applySettings(filters, settings);
		if (settings.todoSortBy === 'ap' || settings.todoSortBy === 'progress' || settings.todoSortBy === 'manual') {
			todoSortBy = settings.todoSortBy;
		}
		await todoList.init(data.toDoList);
	});

	function achievFilterCallback(achiev: AchievementLike) {
		const rewardsObj = achiev.rewardsObj ?? {};
		const mastery = rewardsObj.mastery || [];
		const notCompletedOK = !filters.notCompleted || !achiev.done;
		const withPointsOK = !filters.withPoints || (achiev.points_to_get ?? 0) > 0;
		const withTitlesOK = !filters.withTitles || !!rewardsObj.title;
		const withItemsOK = !filters.withItems || !!rewardsObj.item;
		const withCoinsOK = !filters.withCoins || !!rewardsObj.coins;
		const flags = achiev.flags ?? [];
		const dailyWeeklyOK = (!filters.daily && !filters.weekly) || (filters.daily && flags.includes('Daily')) || (filters.weekly && flags.includes('Weekly'));
		const requiredRegions: string[] = [];
		if (filters.withMasteryCentral) requiredRegions.push('Tyria');
		if (filters.withMasteryHoT) requiredRegions.push('Maguuma');
		if (filters.withMasteryPoF) requiredRegions.push('Desert');
		if (filters.withMasteryIce) requiredRegions.push('Tundra');
		if (filters.withMasteryEoD) requiredRegions.push('Jade');
		if (filters.withMasterySofO) requiredRegions.push('Sky');
		if (filters.withMasteryJW) requiredRegions.push('Unknown');

		const withMasteryOK = !requiredRegions.length || !!mastery.find((x: MasteryReward) => requiredRegions.includes(x.region));
		const filterOK = helperUtils.fullTextSearch(filter, achiev, ['name', 'desription', 'requirement', 'id']);

		return notCompletedOK && withPointsOK && withTitlesOK && withItemsOK && withCoinsOK && withMasteryOK && dailyWeeklyOK && filterOK;
	}

	function saveSettings() {
		utils.saveAchievementsSettings({ ...filters, todoSortBy });
	}

	function sortByTodoMode(items: import('$lib/components/achievements/achievements').AchievementLike[]): import('$lib/components/achievements/achievements').AchievementLike[] {
		if (todoSortBy === 'manual') {
			const indexById: Record<number, number> = {};
			todoList.todos.forEach((id, index) => {
				indexById[Number(id)] = index;
			});
			return [...items].sort((a, b) => {
				const aId = Number(a.id || 0);
				const bId = Number(b.id || 0);
				const aIndex = indexById[aId] ?? Number.MAX_SAFE_INTEGER;
				const bIndex = indexById[bId] ?? Number.MAX_SAFE_INTEGER;
				return aIndex === bIndex ? a.name.localeCompare(b.name) : aIndex - bIndex;
			});
		}
		return sort([...items], todoSortBy);
	}

	function setTodoSortBy(value: TodoSortBy) {
		todoSortBy = value;
		saveSettings();
	}

	function hndTodoReorderByOrder(event: { order: number[] }) {
		if (todoSortBy !== 'manual') {
			setTodoSortBy('manual');
		}
		void todoList.reorderByList(event.order);
	}
</script>

<h1>{$_('achievements.achievements')}</h1>

<img src={asset('/assets/150px-construction.png')} title={$_('common.under_construction')} width="150px" alt="under construction" />

<Awaiter promise={data.achievements as Promise<AchievementsData> | AchievementsData}>
	{#snippet children(result: AchievementsData)}
		{@const typedResult = result as AchievementsView}
		{@const _result = filteredAchievements(typedResult, filter, achievFilterCallback, null, filters)}
		{@const sortedCategories = sort([...( _result.categories as import('$lib/components/achievements/achievements').CategoryLike[] )], filters.sortBy)}
		{@const myItems = sortByTodoMode(expandToDoList(_result, todoList.todos))}
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
				value={typedResult.rewards_to_get.get('title') ?? 0}
				image={asset('/assets/rewards/Talk_collection_option.png')}
			/>
			<WidgetInfo
				title={$_('achievements.items_to_get')}
				value={typedResult.rewards_to_get.get('item') ?? 0}
				image={asset('/assets/rewards/Achievement_Chest_interface_icon.png')}
			/>
			<WidgetInfo title={$_('achievements.gold_to_get')} value={typedResult.rewards_to_get.get('coins') ?? 0} image={asset('/assets/rewards/Merchant_crop.png')}>
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
					<AchievementFilters {filters} onSave={saveSettings} />

					<section>
						<SearchInput bind:value={filter} name="filter" id="filter" placeholder={$_('common.too_much_data')} />
					</section>

					<span>{$_('achievements.showing_out_of', { shown: _result.categories.length, total: typedResult.categories.length })}</span>
					<div class="achiev-container" use:grungeBorder>
						{#each sortedCategories as category (category.id)}
							<AchievGroup {category} {showApiLinks} sortBy={filters.sortBy} todoList={todoList.todos} onToggleTodo={(event: { id: number; todo: boolean }) => todoList.toggle(event)} />
						{/each}
					</div>
				</TabPanel>

				<TabPanel>
					<h2>{$_('achievements.your_list')}</h2>
					<fieldset class="settings todo-sort-settings">
						<legend>{$_('common.settings')}</legend>
						<div class="group">
							<button type="button" class:active={todoSortBy === 'ap'} onclick={() => setTodoSortBy('ap')}>{$_('achievements.sort_by_points')}</button>
							<button type="button" class:active={todoSortBy === 'progress'} onclick={() => setTodoSortBy('progress')}>{$_('achievements.detailed_progress')}</button>
							<button type="button" class:active={todoSortBy === 'manual'} onclick={() => setTodoSortBy('manual')}>{$_('achievements.sort_by_in_game_order')}</button>
						</div>
					</fieldset>
					<AchievList
						items={myItems}
						todoList={todoList.todos}
						onToggleTodo={(event: { id: number; todo: boolean }) => todoList.toggle(event)}
						onReorder={hndTodoReorderByOrder}
					>
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

	.todo-sort-settings {
		margin-bottom: 1em;
		.group {
			display: flex;
			flex-wrap: wrap;
			gap: 0.4em;
		}
		button.active {
			outline: 2px solid var(--gw2helper-module-border);
			font-weight: bold;
		}
	}
</style>

