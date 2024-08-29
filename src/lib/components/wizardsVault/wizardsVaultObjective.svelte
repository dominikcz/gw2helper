<script lang="ts">
	interface WizardsVaultObjective {
		id: number;
		title: string;
		track: 'WvW' | 'PvE' | 'PVP';
		acclaim: number;
		progress_current: number;
		progress_complete: number;
		claimed: boolean;
	}

	import helperUtils from '$lib/utils/helper-utils';
	export let value: WizardsVaultObjective;

	function getClasses() {
		let cssClass = `category-${value.track}`;
		if (value.claimed) {
			cssClass += ' claimed';
		}
		return cssClass;
	}
</script>

<div class="category {getClasses()}">
	<div class="main">
		<span>{value.title}</span>
		<progress value={value.progress_current <= value.progress_complete ? value.progress_current : value.progress_complete} max={value.progress_complete} />
	</div>
	<div class="reward">
		{value.acclaim}
		<a class="tooltip-link" target="_blank" href={helperUtils.wikiLink('Astral_Acclaim')}>
			<img src="/gw2helper/assets/rewards/Astral_Acclaim.png" title="Astral Acclaim" alt="Astral Acclaim" />
		</a>
	</div>
</div>

<style lang="scss">
	:root {
		--gw2helper-wvw-bg: #e3d59e;
		--gw2helper-wvw-progress: #debd39;
		--gw2helper-wvw-progress-bg: #c9c489;

		--gw2helper-pve-bg: #bae8a2;
		--gw2helper-pve-progress: #5bc522;
		--gw2helper-pve-progress-bg: #afd19d;

		--gw2helper-pvp-bg: #fccccd;
		--gw2helper-pvp-progress: #ff8688;
		--gw2helper-pvp-progress-bg: #e6bebf;
	}

	.category {
		display: flex;
		flex-flow: row nowrap;
		padding: 0.6em 0.5em 0.6em 3em;
		column-gap: 1em;
		align-items: center;
		justify-content: space-between;
		&.claimed{
			filter: opacity(35%)
		}
		.main {
			display: flex;
			flex-flow: column nowrap;
			row-gap: 0.4em;
			flex-grow: 1;
		}
		.reward {
			display: flex;
			flex-flow: row nowrap;
			align-items: center;
			justify-content: end;
			width: 4em;
			img {
				width: 2em;
			}
		}
		progress[value] {
			height: 1em;
			width: 100%;
			border: none;
		}
		&.category-WvW {
			background: var(--gw2helper-wvw-bg) url(/gw2helper/assets/rewards/Wizards_Vault_WvW.png) no-repeat 0.5em center;
			progress[value] {
				color: var(--gw2helper-wvw-progress) !important;
				background-color: var(--gw2helper-wvw-progress-bg);
				&::-moz-progress-bar {
					background: var(--gw2helper-wvw-progress);
				}
				&::-webkit-progress-value {
					background: var(--gw2helper-wvw-progress);
				}
				&::-webkit-progress-bar {
					background: var(--gw2helper-wvw-progress-bg);
				}
			}
		}
		&.category-PvP {
			background: var(--gw2helper-pvp-bg) url(/gw2helper/assets/rewards/Wizards_Vault_PvP.png) no-repeat 0.5em center;
			progress[value] {
				color: var(--gw2helper-pvp-progress) !important;
				background-color: var(--gw2helper-pvp-progress-bg);
				&::-moz-progress-bar {
					background: var(--gw2helper-pvp-progress);
				}
				&::-webkit-progress-value {
					background: var(--gw2helper-pvp-progress);
				}
				&::-webkit-progress-bar {
					background: var(--gw2helper-pvp-progress-bg);
				}
			}
		}
		&.category-PvE {
			background: var(--gw2helper-pve-bg) url(/gw2helper/assets/rewards/Wizards_Vault_PvE.png) no-repeat 0.5em center;
			progress[value] {
				color: var(--gw2helper-pve-progress) !important;
				background-color: var(--gw2helper-pve-progress-bg);
				&::-moz-progress-bar {
					background: var(--gw2helper-pve-progress);
				}
				&::-webkit-progress-value {
					background: var(--gw2helper-pve-progress);
				}
				&::-webkit-progress-bar {
					background: var(--gw2helper-pve-progress-bg);
				}
			}
		}
	}

	@media (prefers-color-scheme: dark) {
		:root {
			--gw2helper-wvw-bg: #8e7a35;
			--gw2helper-wvw-progress: #d7b436;
			--gw2helper-wvw-progress-bg: #594b16;

			--gw2helper-pve-bg: #6F9867;
			--gw2helper-pve-progress: #87ff6f;
			--gw2helper-pve-progress-bg: #4b6647;

			--gw2helper-pvp-bg: #B05C6A;
			--gw2helper-pvp-progress: #a33447;
			--gw2helper-pvp-progress-bg: #8f6068;
		}
	}
</style>
