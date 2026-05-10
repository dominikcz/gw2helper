<script lang="ts">
	import wxdates from '$lib/wxjs_dates';
	import WizardsVaultObjective from '$lib/components/wizardsVault/wizardsVaultObjective.svelte';
	import AstralAcclaim from '$lib/components/branding/astralAcclaim.svelte';
	import Clock from '$lib/services/clock.svelte';
	import { t as _ } from '$lib/services/i18n';
	import { grungeBorder } from '$lib/actions/grungeBorder';
	import Progress from '../progress/progress.svelte';

	type Objective = {
		claimed: boolean;
		acclaim: number;
	};

	type VaultCategoryData = {
		objectives: Objective[];
		meta_reward_claimed?: boolean;
		meta_reward_astral?: number;
		meta_progress_current?: number;
		meta_progress_complete?: number;
	};

	/** @type {{data: VaultCategoryData, targetTime: Date, title: string}} */
	let { data = $bindable(), targetTime, title } = $props();

	let timeLeft = $state<string>('');
	let time = new Clock({ interval: 1000 });
	let accLeft = acclaimLeft();

	function updateTime(){
		timeLeft = wxdates.friendlyDurationTill(time.value, targetTime);
	}

	function acclaimLeft() {
		const points = data.objectives.filter((x: Objective) => !x.claimed).reduce((acc: number, val: Objective) => acc + val.acclaim, 0);
		data.meta_reward_claimed ??= false;
		data.meta_reward_astral ??= 0;
		return data.meta_reward_claimed ? points : points + data.meta_reward_astral;
	}

	function progressValue(){
		return (data.meta_progress_current) ? data.meta_progress_current : data.objectives.filter((x: Objective) => x.claimed).length;
	}

	function progressMax(){
		return (data.meta_progress_complete) ? data.meta_progress_complete : data.objectives.length;
	}

	// svelte-ignore state_referenced_locally
	console.log(`${title}: ${targetTime.toISOString()}`, data);

	$effect(() => {
		updateTime();
	});
</script>

<details use:grungeBorder>
	<summary
		>{title}
		<div class="info">
			<Progress value={progressValue()} max={progressMax()} label={timeLeft} />
			<div class="reward">
				{accLeft}
				<AstralAcclaim />
			</div>
		</div>
	</summary>
	<article>
		{#each data.objectives as value}
			<WizardsVaultObjective {value} />
		{/each}
	</article>
</details>

