<script lang="ts">
	import WizardsVaultCategory from '$lib/components/wizardsVault/wizardsVaultCategory.svelte';
	import Awaiter from '$lib/components/ui/awaiter.svelte';
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
	import { Period, getTimerTarget, currentDay, currentWeek } from '$lib/components/daily/dailyUtils';
	import todoList from '$lib/services/todoList.svelte';
	import type { PageData } from './$types';
	import type { AchievementsData, CategoryLike } from '$lib/components/achievements/achievements';
	import type { AccountWithLocalDates, WalletCurrency, WizardsVaultCategoryData } from '$lib/types/gw2-api';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let sortBy = 'ap';
	let showApiLinks = false;

	onMount(async () => {
		await todoList.init(data.toDoList);
	});

	function astralAcclaimAvailable(wallet: WalletCurrency[]) {
		const astralAcclaim = wallet.find((x: WalletCurrency) => x.id === 63);
		if (!astralAcclaim) {
			return 0;
		}
		return astralAcclaim.value || 0;
	}
</script>

<h1>{$_('daily.daily_and_weekly')}</h1>

<h2>{$_('daily.wizards_vault')}</h2>

<Awaiter promise={data.wallet as Promise<WalletCurrency[]> | WalletCurrency[]}>
	{#snippet children(result: WalletCurrency[])}
		<WidgetInfo title={$_('daily.your_astral_acclaims')} value={`${astralAcclaimAvailable(result)}`} image={asset('/assets/rewards/Astral_Acclaim.png')} />
	{/snippet}
</Awaiter>

<Awaiter promise={data.account as Promise<AccountWithLocalDates> | AccountWithLocalDates}>
	{#snippet children(result: AccountWithLocalDates)}
		{@const lastModified = result.last_modified || new Date(0).toISOString()}
		{#if !currentDay(lastModified)}
			<InfoBlock caption={$_('daily.info.hint')}>{@html $_('daily.info.hint-content')}</InfoBlock>
		{/if}
		<Awaiter promise={data.daily as Promise<WizardsVaultCategoryData> | WizardsVaultCategoryData}>
			{#snippet children(resultDaily: WizardsVaultCategoryData)}
				{#if currentDay(lastModified)}
					<WizardsVaultCategory title={$_('daily.daily')} data={resultDaily} targetTime={getTimerTarget(Period.daily)} />
				{/if}
			{/snippet}
		</Awaiter>

		<Awaiter promise={data.weekly as Promise<WizardsVaultCategoryData> | WizardsVaultCategoryData}>
			{#snippet children(resultWeekly: WizardsVaultCategoryData)}
				{#if currentWeek(lastModified)}
					<WizardsVaultCategory title={$_('daily.weekly')} data={resultWeekly} targetTime={getTimerTarget(Period.weekly)} />
				{/if}
			{/snippet}
		</Awaiter>
	{/snippet}
</Awaiter>

<Awaiter promise={data.special as Promise<WizardsVaultCategoryData> | WizardsVaultCategoryData}>
	{#snippet children(result: WizardsVaultCategoryData)}
		<WizardsVaultCategory title={$_('daily.special')} data={result} targetTime={getTimerTarget(Period.special, data.seasonEnd ?? undefined)} />
	{/snippet}
</Awaiter>

<h2>{$_('daily.achievements')}</h2>
<h3>{$_('achievements.your_list')}</h3>

<Awaiter promise={data.achievements as Promise<AchievementsData> | AchievementsData}>
	{#snippet children(result: AchievementsData)}
		{@const dailies = extractDaily(result)}
		{@const weeklies = extractWeekly(result)}
		{@const dailiesWeeklies = extractDailyAndWeekly(result)}
		{@const sortedDailyCategories = sort([...(dailies.categories as CategoryLike[])], sortBy)}
		{@const sortedWeeklyCategories = sort([...(weeklies.categories as CategoryLike[])], sortBy)}
		{@const todos = expandToDoList(dailiesWeeklies, todoList.todos)}

		<AchievList items={todos} todoList={todoList.todos} onToggleTodo={(event: { id: number; todo: boolean }) => todoList.toggle(event)}>
			{@html $_('achievements.empty_list', { img_url: asset('/assets/rewards/map_heart_empty.png') })}
		</AchievList>

		<h3>{$_('daily.daily')}</h3>
		<div class="achiev-container" use:grungeBorder>
			{#each sortedDailyCategories as category (category.id)}
				<AchievGroup {category} {showApiLinks} {sortBy} todoList={todoList.todos} onToggleTodo={(event: { id: number; todo: boolean }) => todoList.toggle(event)} />
			{/each}
		</div>
		<h3>{$_('daily.weekly')}</h3>
		<div class="achiev-container" use:grungeBorder>
			{#each sortedWeeklyCategories as category (category.id)}
				<AchievGroup {category} {showApiLinks} {sortBy} todoList={todoList.todos} onToggleTodo={(event: { id: number; todo: boolean }) => todoList.toggle(event)} />
			{/each}
		</div>
	{/snippet}
</Awaiter>

