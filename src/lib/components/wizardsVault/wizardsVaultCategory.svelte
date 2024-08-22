<script>
	import wxdates from '$lib/wxjs_dates';
	import WizardsVaultObjective from '$lib/components/wizardsVault/wizardsVaultObjective.svelte';

	export let data;
	export let targetTime;
	export let title;

	function timeLeft(target) {
		return wxdates.friendlyDurationTill(new Date(), target);
	}

	function notClaimed() {
		return data.objectives.filter((x) => !x.claimed).length;
	}

	console.log(`${title}: ${targetTime.toISOString()}`);
</script>

<details>
	<summary
		>{title}
		<div class="info">
			<div class="timer">{timeLeft(targetTime)}</div>
			{#if data.meta_progress_current}
				<progress value={data.meta_progress_current} max={data.meta_progress_complete} />
			{:else}
				<span>{notClaimed()} objectives left</span>
			{/if}
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
