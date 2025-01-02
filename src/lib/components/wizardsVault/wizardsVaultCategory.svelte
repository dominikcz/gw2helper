<script>
	import wxdates from '$lib/wxjs_dates';
	import WizardsVaultObjective from '$lib/components/wizardsVault/wizardsVaultObjective.svelte';
	import AstralAcclaim from '../astralAcclaim.svelte';
	import Clock from '$lib/services/clock.svelte';
	import { t as _ } from '$lib/services/i18n';
	import { grungeBorder } from '$lib/actions/grungeBorder';

	/** @type {{data: any, targetTime: any, title: any}} */
	let { data = $bindable(), targetTime, title } = $props();

	let timeLeft = $state();
	let time = new Clock({ interval: 1000 });

	function updateTime(){
		timeLeft = wxdates.friendlyDurationTill(time.value, targetTime);
	}

	function notClaimed() {
		return data.objectives.filter((x) => !x.claimed).length;
	}

	function acclaimLeft() {
		const points = data.objectives.filter((x) => !x.claimed).reduce((acc, val) => acc + val.acclaim, 0);
		data.meta_reward_claimed ??= false;
		data.meta_reward_astral ??= 0;
		return data.meta_reward_claimed ? points : points + data.meta_reward_astral;
	}

	console.log(`${title}: ${targetTime.toISOString()}`);
	$effect(() => {
		updateTime();
	});
</script>

<details use:grungeBorder>
	<summary
		>{title}
		<div class="info">
			<div class="timer">{timeLeft}</div>
			{#if data.meta_progress_current}
				<progress value={data.meta_progress_current} max={data.meta_progress_complete}></progress>
			{:else}
				<span>{$_('daily.objectives_left', {objectivesCount: notClaimed()}) }</span>
			{/if}
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

<style lang="scss">
	details {
		display: flex;
		flex-flow: column wrap;
		gap: 1em;
		margin: 0;
		background-color: var(--gw2helper-module);
		summary {
			display: flex;
			flex-flow: row nowrap;
			column-gap: 0.6em;
			justify-content: flex-start;
			align-items: center;
			&::before {
				content: '\25b6';
				transition: 0.2s;
			}
			.info {
				display: flex;
				flex-flow: column nowrap;
				justify-content: end;
				align-items: end;
				flex-grow: 1;
				@media screen and (min-width: 30em) {
					flex-flow: row nowrap;
					column-gap: 1em;
					justify-content: end;
					align-items: center;
				}
			}
			.reward {
				display: flex;
				flex-flow: row nowrap;
				align-items: center;
				justify-content: end;
				width: 4em;
			}
		}
		&[open] summary::before {
			transform: rotate(90deg);
		}
	}
	progress[value] {
		height: 1em;
		width: 8em;
		border: none;
		color: var(--gw2helper-module-text) !important;
		background-color: var(--gw2helper-module-dark);
		&::-moz-progress-bar {
			background: var(--gw2helper-module-text);
		}
		&::-webkit-progress-value {
			background: var(--gw2helper-module-text);
		}
		&::-webkit-progress-bar {
			background: var(--gw2helper-module-dark);
		}
	}

	article {
		display: flex;
		flex-flow: column nowrap;
		row-gap: 0.6em;
	}
</style>
