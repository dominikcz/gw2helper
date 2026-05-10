<script lang="ts">
	import WizardsVaultCategory from '$lib/components/wizardsVault/wizardsVaultCategory.svelte';
	import wxdates from '$lib/wxjs_dates';
	import Awaiter from '$lib/components/awaiter.svelte';
	import WidgetInfo from '$lib/components/widgets/widgetInfo.svelte';
	import { asset } from '$app/paths';
	import AchievGroup from '$lib/components/achievements/achievGroup.svelte';
	import { sort, extractDaily, extractWeekly, extractDailyAndWeekly } from '$lib/components/achievements/achievements';
	import { t as _ } from '$lib/services/i18n';
	import utils from '$lib/utils';
	import { onMount } from 'svelte';
	import { grungeBorder } from '$lib/actions/grungeBorder';
	import AchievList from '$lib/components/achievements/achievList.svelte';
	import { expandToDoList } from '$lib/components/achievements/achievements';
	import InfoBlock from '$lib/components/infoBlock/infoBlock.svelte';
	import type { PageData } from './$types';
	import type { AchievementsData } from '$lib/components/achievements/achievements';

	interface Props {
		data: PageData;
	}

	type VaultCategoryData = {
		objectives: Array<{ claimed: boolean; acclaim: number }>;
		meta_reward_claimed?: boolean;
		meta_reward_astral?: number;
		meta_progress_current?: number;
		meta_progress_complete?: number;
	};

	type AccountSummary = { last_modified: string };

	let { data }: Props = $props();

	let sortBy = 'ap';
	let showApiLinks = false;
	let todoList = $state<number[]>([]);

	type WalletCurrency = {
		id: number;
		value: number;
	};

	// svelte-ignore non_reactive_update
	enum Period {
		daily = 'daily',
		weekly = 'weekly',
		special = 'special',
	}

	onMount(async () => {
		todoList = (await data.toDoList) as number[];
	});

	function astralAcclaimAvailable(wallet: WalletCurrency[]) {
		const astralAcclaim = wallet.find((x: WalletCurrency) => x.id === 63);
		if (!astralAcclaim) {
			return 0;
		}
		return astralAcclaim.value || 0;
	}

	function getTimerTarget(period: Period): Date {
		let target = new Date();
		switch (period) {
			case Period.daily:
				target = Date.prototype.wxTomorrow(true, 0, 0, 0);
				break;
			case Period.weekly:
				target = Date.prototype.wxNextWeekDay(1, true, 7, 30, 0);
				break;
			case Period.special:
				target = data.seasonEnd ? new Date(data.seasonEnd) : new Date();
				break;
		}
		return target;
	}

	function currentDay(dt: string): boolean {
		const currentDate = new Date(dt);
		const currDay = Date.prototype.wxToday(true, 0, 0, 0);
		return wxdates.secondsBetween(currentDate, currDay, false) >= 0;
	}
	function currentWeek(dt: string): boolean {
		const currentDate = new Date(dt);
		const startOfWeek = wxdates.dateAdd(Date.prototype.wxNextWeekDay(1, true, 0, 0, 0), 'day', -7) || new Date(0);
		return wxdates.secondsBetween(currentDate, startOfWeek, false) >= 0;
	}
</script>

<h1>{$_('daily.daily_and_weekly')}</h1>

<h2>{$_('daily.wizards_vault')}</h2>

<Awaiter promise={data.wallet as Promise<WalletCurrency[]> | WalletCurrency[]}>
	{#snippet children(result: WalletCurrency[])}
		<WidgetInfo title={$_('daily.your_astral_acclaims')} value={`${astralAcclaimAvailable(result)}`} image={asset('/assets/rewards/Astral_Acclaim.png')} />
	{/snippet}
</Awaiter>

<Awaiter promise={data.account as Promise<AccountSummary> | AccountSummary}>
	{#snippet children(result: AccountSummary)}
		{#if !currentDay(result.last_modified)}
			<InfoBlock caption={$_('daily.info.hint')}>{@html $_('daily.info.hint-content')}</InfoBlock>
		{/if}
		<Awaiter promise={data.daily as Promise<VaultCategoryData> | VaultCategoryData}>
			{#snippet children(resultDaily: VaultCategoryData)}
				{#if currentDay(result.last_modified)}
					<WizardsVaultCategory title={$_('daily.daily')} data={resultDaily} targetTime={getTimerTarget(Period.daily)} />
				{/if}
			{/snippet}
		</Awaiter>

		<Awaiter promise={data.weekly as Promise<VaultCategoryData> | VaultCategoryData}>
			{#snippet children(resultWeekly: VaultCategoryData)}
				{#if currentWeek(result.last_modified)}
					<WizardsVaultCategory title={$_('daily.weekly')} data={resultWeekly} targetTime={getTimerTarget(Period.weekly)} />
				{/if}
			{/snippet}
		</Awaiter>
	{/snippet}
</Awaiter>

<Awaiter promise={data.special as Promise<VaultCategoryData> | VaultCategoryData}>
	{#snippet children(result: VaultCategoryData)}
		<WizardsVaultCategory title={$_('daily.special')} data={result} targetTime={getTimerTarget(Period.special)} />
	{/snippet}
</Awaiter>

<h2>{$_('daily.achievements')}</h2>
<h3>{$_('achievements.your_list')}</h3>

<Awaiter promise={data.achievements as Promise<AchievementsData> | AchievementsData}>
	{#snippet children(result: AchievementsData)}
		{@const dailies = extractDaily(result)}
		{@const weeklies = extractWeekly(result)}
		{@const dailiesWeeklies = extractDailyAndWeekly(result)}
		{@const todos = expandToDoList(dailiesWeeklies, todoList)}

		<AchievList items={todos} {todoList} onToggleTodo={(event: { id: number; todo: boolean }) => utils.hndToggleTodo(event, todoList)}>
			{@html $_('achievements.empty_list', { img_url: asset('/assets/rewards/map_heart_empty.png') })}
		</AchievList>

		<h3>{$_('daily.daily')}</h3>
		<div class="achiev-container" use:grungeBorder>
					{#each sort(dailies.categories as import('$lib/components/achievements/achievements').CategoryLike[], sortBy) as category (category.id)}
				<AchievGroup {category} {showApiLinks} {sortBy} {todoList} onToggleTodo={(event: { id: number; todo: boolean }) => utils.hndToggleTodo(event, todoList)} />
			{/each}
		</div>
		<h3>{$_('daily.weekly')}</h3>
		<div class="achiev-container" use:grungeBorder>
					{#each sort(weeklies.categories as import('$lib/components/achievements/achievements').CategoryLike[], sortBy) as category (category.id)}
				<AchievGroup {category} {showApiLinks} {sortBy} {todoList} onToggleTodo={(event: { id: number; todo: boolean }) => utils.hndToggleTodo(event, todoList)} />
			{/each}
		</div>
	{/snippet}
</Awaiter>
