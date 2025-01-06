<script>
    import { base } from "$app/paths";
	import { autotooltip } from "$lib/actions/autotooltip";
	import helperUtils from "$lib/utils/helper-utils";
	import Price from "../price.svelte";
	import Wiki from "../wiki.svelte";
	import AchievList from "./achievList.svelte";
    import { sort } from "./achievements";
    import { t as _ } from "$lib/services/i18n";
	import { grungeBorder } from "$lib/actions/grungeBorder";

    /** @type {{category: any, todoList?: any, showApiLinks?: boolean, sortBy?: string, onToggleTodo?: CallableFunction }} */
    let {
        category,
        todoList = [],
        showApiLinks = false,
        sortBy = 'ap',
        onToggleTodo = () => {},
    } = $props();

</script>

<details class="achiev-group" use:autotooltip use:grungeBorder>
    <summary>
        <img src={category.icon} alt={category.name} />
        <div class="descr">
            <span>
                {category.name}
                {#if showApiLinks}
                    <small>
                        <a href="https://api.guildwars2.com/v2/achievements/categories/{category.id}" target="_blank">
                            id: {category.id}
                        </a>
                    </small>
                {/if}
            </span>
            <div class="rewards large">
                {#if category.rewards_to_get.has('title')}
                    <div class="reward-item">
                        <span>{category.rewards_to_get.get('title')}</span>
                        <img src="{base}/assets/rewards/Title_icon.png" alt="title" title={$_('achievements.rewards_title')} />
                    </div>
                {/if}
                {#if category.rewards_to_get.has('coins')}
                    <div class="reward-item">
                        <Price value={category.rewards_to_get.get('coins')} />
                    </div>
                {/if}
                {#if category.rewards_to_get.has('item')}
                    <div class="reward-item">
                        <span>{category.rewards_to_get.get('item')}</span>
                        <img
                            src="{base}/assets/rewards/Achievement_Chest_interface_icon.png"
                            alt="item"
                            title={$_('achievements.rewards_items')}
                        />
                    </div>
                {/if}
                {#if category.rewards_to_get.has('mastery_tyria')}
                    <div class="reward-item">
                        <span>{category.rewards_to_get.get('mastery_tyria')}</span>
                        <img
                            src="{base}/assets/rewards/Mastery_point_Central_Tyria.png"
                            alt="mastery points Central Tyria"
                            title={$_('achievements.rewards_mastery_tyria')}
                        />
                    </div>
                {/if}
                {#if category.rewards_to_get.has('mastery_maguuma')}
                    <div class="reward-item">
                        <span>{category.rewards_to_get.get('mastery_maguuma')}</span>
                        <img
                            src="{base}/assets/rewards/Mastery_point_Heart_of_Thorns.png"
                            alt="mastery points Heart of Thorns"
                            title={$_('achievements.rewards_mastery_hot')}
                        />
                    </div>
                {/if}
                {#if category.rewards_to_get.has('mastery_desert')}
                    <div class="reward-item">
                        <span>{category.rewards_to_get.get('mastery_desert')}</span>
                        <img
                            src="{base}/assets/rewards/Mastery_point_Path_of_Fire.png"
                            alt="mastery points Path of Fire"
                            title={$_('achievements.rewards_mastery_pof')}
                        />
                    </div>
                {/if}
                {#if category.rewards_to_get.has('mastery_tundra')}
                    <div class="reward-item">
                        <span>{category.rewards_to_get.get('mastery_tundra')}</span>
                        <img
                            src="{base}/assets/rewards/Mastery_point_Icebrood_Saga.png"
                            alt="mastery points Icebrood Saga"
                            title={$_('achievements.rewards_mastery_ice')}
                        />
                    </div>
                {/if}
                {#if category.rewards_to_get.has('mastery_jade')}
                    <div class="reward-item">
                        <span>{category.rewards_to_get.get('mastery_jade')}</span>
                        <img
                            src="{base}/assets/rewards/Mastery_point_End_of_Dragons.png"
                            alt="mastery points End of Dragons"
                            title={$_('achievements.rewards_mastery_eod')}
                        />
                    </div>
                {/if}
                {#if category.rewards_to_get.has('mastery_sky')}
                    <div class="reward-item">
                        <span>{category.rewards_to_get.get('mastery_sky')}</span>
                        <img
                            src="{base}/assets/rewards/Mastery_point_Secrets_of_the_Obscure.png"
                            alt="mastery points Secrets of the Obscure"
                            title={$_('achievements.rewards_mastery_soto')}
                        />
                    </div>
                {/if}
                {#if category.rewards_to_get.has('mastery_unknown')}
                    <div class="reward-item">
                        <span>{category.rewards_to_get.get('mastery_unknown')}</span>
                        <img
                            src="{base}/assets/rewards/Mastery_point_Janthir_Wilds.png"
                            alt="mastery points Janthir Wilds"
                            title={$_('achievements.rewards_mastery_jw')}
                        />
                    </div>
                {/if}
                {#if category.points_to_get}
                    <div class="reward-item">
                        <span>{category.points_to_get}</span>
                        <img
                            src="{base}/assets/rewards/AP.png"
                            alt="achievement points"
                            title={$_('achievements.rewards_ap_left', {points: category.points_to_get})}
                        />
                    </div>
                {/if}
                <div class="reward-item">
                    <span>{category.achievements.length}</span>
                    <img
                        src="{base}/assets/rewards/Achievements_Summary.png"
                        alt="achievements"
                        title={$_('achievements.achievements_left', {todo: category.achievements.length})}
                    />
                    <a href={helperUtils.wikiLink(category.name)} target="_blank" title={$_('common.read_more_on_wiki')}>
                        <Wiki width="1.8em" height="1.8em" />
                    </a>
                </div>
            </div>
        </div>
    </summary>
    {#if category.description}<p>{category.description}</p>{/if}
    <AchievList items={sort(category.achievements, sortBy)} {todoList} {onToggleTodo} />
</details>

<style lang="scss">
	.achiev-group {
		display: flex;
		flex-flow: column wrap;
		gap: 1em;
		margin: 0;
		background-color: var(--gw2helper-module);
		summary {
			padding: 0.4em 0.4em;
			display: flex;
			flex-flow: row nowrap;
			justify-content: flex-start;
			align-items: center;
			gap: 0.6em;
			&::before {
				content: '\25b6';
				transition: 0.2s;
			}

			.descr {
				display: flex;
				flex-flow: column nowrap;
				justify-content: flex-start;
				align-items: flex-start;
				gap: 0.6em;
				width: 100%;
			}
		}
		&[open] summary::before {
			transform: rotate(90deg);
		}
		img {
			width: 3em;
			height: 3em;
			// &.small {
			// 	width: 1.5em;
			// 	height: 1.5em;
			// 	vertical-align: bottom;
			// }
		}
	}
	.rewards {
		width: 100%;
		display: flex;
		flex-flow: row wrap;
		align-items: center;
		justify-content: flex-end;
		column-gap: 0.6em;
		row-gap: 0.2em;
		// font-family: monospace;
		&.large {
			.reward-item {
				font-size: medium;
				img {
					width: 1.5em;
					height: 1.5em;
				}
			}
		}

		.reward-item {
			display: flex;
			flex-flow: row nowrap;
			align-items: center;
			font-size: medium;
			column-gap: 0.2em;
			a {
				color: var(--gw2helper-module-text);
				height: 1.8em;
			}
			img {
				width: 1.5em;
				height: 1.5em;
			}
		}
	}

	@media (min-width: 420px) {
		.achiev-group {
			summary {
				.descr {
					flex-flow: row nowrap;
					justify-content: space-between;
					align-items: center;
					gap: 0.6em;
					width: 100%;
				}
			}
		}
		.rewards {
			width: auto;
			&.large {
				.reward-item {
					font-size: large;
					img {
						width: 2.25em;
						height: 2.25em;
					}
				}
			}
		}
	}

</style>
