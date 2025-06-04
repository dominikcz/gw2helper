<script lang="ts">
	import WizardsVaultCategory from '$lib/components/wizardsVault/wizardsVaultCategory.svelte';
	import wxdates from '$lib/wxjs_dates';
	import Awaiter from '$lib/components/awaiter.svelte';
	import WidgetInfo from '$lib/components/widgets/widgetInfo.svelte';
	import { base } from '$app/paths';
	import AchievGroup from '$lib/components/achievements/achievGroup.svelte';
	import { sort, extractDaily, extractWeekly, extractDailyAndWeekly } from '$lib/components/achievements/achievements.js';
	import { t as _ } from '$lib/services/i18n.js';
	import utils from '$lib/utils';
	import { onMount } from 'svelte';
	import { grungeBorder } from '$lib/actions/grungeBorder';
	import AchievList from '$lib/components/achievements/achievList.svelte';
	import { expandToDoList } from '$lib/components/achievements/achievements.js';
	import InfoBlock from '$lib/components/infoBlock/infoBlock.svelte';

	interface Props {
		data: any;
	}

	let { data }: Props = $props();

	let sortBy = 'ap';
	let showApiLinks = false;
	let todoList = $state([]);

	// svelte-ignore non_reactive_update
	enum Period {
		daily = 'daily',
		weekly = 'weekly',
		special = 'special',
	}

	onMount(async () => {
		todoList = await data.toDoList;
	});

	function astralAcclaimAvailable(wallet) {
		const astralAcclaim = wallet.find((x) => x.id == 63);
		return astralAcclaim.value || 0;
	}

	function gw2NextQuarter() {
		const today = new Date();
		const y = today.getFullYear();

		// prettier-ignore
		const quarters = [
			new Date(y, 2, 4), 
			new Date(y, 5, 4), 
			new Date(y, 9,  29), 
			new Date(y, 12, 29), 
			new Date(y + 1, 3, 29)
		];

		quarters.forEach((q) => {
			q = wxdates.setTime(q, true, 16, 0, 0); // 16:00 UTC
		});
		// console.log('quarters', quarters.map(x => x.toLocaleString()))

		return quarters.find((x) => x > today);
	}

	function getTimerTarget(period: Period) {
		let target;
		switch (period) {
			case Period.daily:
				target = Date.prototype.wxTomorrow(true, 0, 0, 0);
				break;
			case Period.weekly:
				target = Date.prototype.wxNextWeekDay(1, true, 7, 30, 0);
				break;
			case Period.special:
				target = gw2NextQuarter();
				break;
		}
		return target;
	}

	function currentDay(dt) {
		dt = new Date(dt);
		const currDay = Date.prototype.wxToday(true, 0, 0, 0);
		return wxdates.secondsBetween(dt, currDay, false) >= 0;
	}
	function currentWeek(dt) {
		dt = new Date(dt);
		const startOfWeek = wxdates.dateAdd(Date.prototype.wxNextWeekDay(1, true, 0, 0, 0), 'day', -7);
		return wxdates.secondsBetween(dt, startOfWeek, false) >= 0;
	}
</script>

<h1>{$_('daily.daily_and_weekly')}</h1>

<h2>{$_('daily.wizards_vault')}</h2>

<Awaiter promise={data.wallet}>
	{#snippet children(result)}
		<WidgetInfo title={$_('daily.your_astral_acclaims')} value={astralAcclaimAvailable(result)} image="{base}/assets/rewards/Astral_Acclaim.png" />
	{/snippet}
</Awaiter>

<Awaiter promise={data.account}>
	{#snippet children(result)}
		{#if !currentDay(result.last_modified)}
			<InfoBlock caption={$_('daily.info.hint')}>{@html $_('daily.info.hint-content')}</InfoBlock>
		{/if}
		<Awaiter promise={data.daily}>
			{#snippet children(resultDaily)}
				{#if currentDay(result.last_modified)}
					<WizardsVaultCategory title={$_('daily.daily')} data={resultDaily} targetTime={getTimerTarget(Period.daily)} />
				{/if}
			{/snippet}
		</Awaiter>

		<Awaiter promise={data.weekly}>
			{#snippet children(resultWeekly)}
				{#if currentWeek(result.last_modified)}
					<WizardsVaultCategory title={$_('daily.weekly')} data={resultWeekly} targetTime={getTimerTarget(Period.weekly)} />
				{/if}
			{/snippet}
		</Awaiter>
	{/snippet}
</Awaiter>

<Awaiter promise={data.special}>
	{#snippet children(result)}
		<WizardsVaultCategory title={$_('daily.special')} data={result} targetTime={getTimerTarget(Period.special)} />
	{/snippet}
</Awaiter>

<h2>{$_('daily.achievements')}</h2>
<h3>{$_('achievements.your_list')}</h3>

<Awaiter promise={data.achievements}>
	{#snippet children(result)}
		{@const dailies = extractDaily(result)}
		{@const weeklies = extractWeekly(result)}
		{@const dailiesWeeklies = extractDailyAndWeekly(result)}
		{@const todos = expandToDoList(dailiesWeeklies, todoList)}

		<AchievList items={todos} {todoList} onToggleTodo={(event) => utils.hndToggleTodo(event, todoList)}>
			{@html $_('achievements.empty_list', { img_url: `${base}/assets/rewards/map_heart_empty.png` })}
		</AchievList>

		<h3>{$_('daily.daily')}</h3>
		<div class="achiev-container" use:grungeBorder>
			{#each sort(dailies.categories, sortBy) as category (category.id)}
				<AchievGroup {category} {showApiLinks} {sortBy} {todoList} onToggleTodo={(event) => utils.hndToggleTodo(event, todoList)} />
			{/each}
		</div>
		<h3>{$_('daily.weekly')}</h3>
		<div class="achiev-container" use:grungeBorder>
			{#each sort(weeklies.categories, sortBy) as category (category.id)}
				<AchievGroup {category} {showApiLinks} {sortBy} {todoList} onToggleTodo={(event) => utils.hndToggleTodo(event, todoList)} />
			{/each}
		</div>
	{/snippet}
</Awaiter>
