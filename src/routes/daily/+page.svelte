<script lang="ts">
	import WizardsVaultCategory from '$lib/components/wizardsVault/wizardsVaultCategory.svelte';
	import wxdates from '$lib/wxjs_dates';
	import Awaiter from '$lib/components/awaiter.svelte';
	import WidgetInfo from '$lib/components/widgets/widgetInfo.svelte';
	import { base } from '$app/paths';
	import AchievGroup from '$lib/components/achievements/achievGroup.svelte';
	import { sort, filteredAchieves } from '$lib/components/achievements/achieves.js';
	import { _ } from 'svelte-i18n';

	export let data;

	let sortBy = 'ap';
	let showApiLinks = false;
	let todoList=[];

	enum Period {
		daily = 'daily',
		weekly = 'weekly',
		special = 'special',
	}

	function astralAcclaimAvailable(wallet) {
		const astralAcclaim = wallet.find((x) => x.id == 63);
		return astralAcclaim.value || 0;
	}

	function gw2NextQuarter() {
		// TODO: maybe it would be better to get end time from /v2/wizardsvault?
		const today = new Date();
		const y = today.getFullYear();

		// prettier-ignore
		const quarters = [
			new Date(y, 1, 20), 
			new Date(y, 4, 20), 
			new Date(y, 7, 20), 
			new Date(y, 10, 20), 
			new Date(y + 1, 1, 20)
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

	function filterDaily(x){
		return x.flags.includes('Daily');
	}

	function filterWeekly(x){
		return x.flags.includes('Weekly');
	}

	function onlyActiveCategories(x) {
		// it should be done on the level of an additional layer over api, but for now just quick reset of rewards
		x.rewards_to_get.clear();
		x.points_to_get = 0;

		return !x.ignore;
	}

	function extractDaily(achieves) {
		return filteredAchieves(achieves, '', filterDaily, onlyActiveCategories );
	}

	function extractWeekly(achieves) {
		return filteredAchieves(achieves, '', filterWeekly, onlyActiveCategories );
	}
</script>

<h1>{ $_('daily.daily_and_weekly') }</h1>

<h2>{ $_('daily.wizards_vault') }</h2>

<Awaiter promise={data.wallet} let:result>
	<WidgetInfo title="{ $_('daily.your_astral_acclaims') }" value={astralAcclaimAvailable(result)} image="{base}/assets/rewards/Astral_Acclaim.png" />
</Awaiter>

<Awaiter promise={data.daily} let:result>
	<WizardsVaultCategory title="{ $_('daily.daily') }" data={result} targetTime={getTimerTarget(Period.daily)} />
</Awaiter>

<Awaiter promise={data.weekly} let:result>
	<WizardsVaultCategory title="{ $_('daily.weekly') }" data={result} targetTime={getTimerTarget(Period.weekly)} />
</Awaiter>

<Awaiter promise={data.special} let:result>
	<WizardsVaultCategory title="{ $_('daily.special') }" data={result} targetTime={getTimerTarget(Period.special)} />
</Awaiter>

<h2>{ $_('daily.achievements') }</h2>
<img src="/gw2helper/assets/150px-construction.png" title="{ $_('common.under_constrution') }" width="150px" alt="under construction" />

<Awaiter promise={data.achievements} let:result>
	{@const dailies = extractDaily(result)}
	{@const weeklies = extractWeekly(result)}
	<h4>{ $_('daily.daily') }</h4>
	<div class="achiev-container">
		{#each sort(dailies.categories, sortBy) as category (category.id)}
			<AchievGroup {category} {showApiLinks} {sortBy} {todoList}/>
		{/each}
	</div>
	<h4>{ $_('daily.weekly') }</h4>
	<div class="achiev-container">
		{#each sort(weeklies.categories, sortBy) as category (category.id)}
			<AchievGroup {category} {showApiLinks} {sortBy} {todoList}/>
		{/each}
	</div>
</Awaiter>
