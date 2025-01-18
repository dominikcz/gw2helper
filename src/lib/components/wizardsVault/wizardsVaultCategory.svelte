<script>
	import wxdates from '$lib/wxjs_dates';
	import WizardsVaultObjective from '$lib/components/wizardsVault/wizardsVaultObjective.svelte';
	import AstralAcclaim from '../astralAcclaim.svelte';
	import Clock from '$lib/services/clock.svelte';
	import { t as _ } from '$lib/services/i18n';
	import { grungeBorder } from '$lib/actions/grungeBorder';
	import Progress from '../progress/progress.svelte';

	/** @type {{data: any, targetTime: any, title: any}} */
	let { data = $bindable(), targetTime, title } = $props();

	let timeLeft = $state();
	let time = new Clock({ interval: 1000 });

	function updateTime(){
		timeLeft = wxdates.friendlyDurationTill(time.value, targetTime);
	}

	function acclaimLeft() {
		const points = data.objectives.filter((x) => !x.claimed).reduce((acc, val) => acc + val.acclaim, 0);
		data.meta_reward_claimed ??= false;
		data.meta_reward_astral ??= 0;
		return data.meta_reward_claimed ? points : points + data.meta_reward_astral;
	}

	function progressValue(){
		return (data.meta_progress_current) ? data.meta_progress_current : data.objectives.filter((x) => x.claimed).length;
	}

	function progressMax(){
		return (data.meta_progress_complete) ? data.meta_progress_complete : data.objectives.length;
	}

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
				{acclaimLeft()}
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

