<script>
	import helperUtils from '$lib/utils/helper-utils';
	import { base } from '$app/paths';
	import Price from '$lib/components/price.svelte';
	import Wiki from '../wiki.svelte';
	import { getQueryStringFlag } from '$lib/utils';
	import { t as _ } from '$lib/services/i18n';

	/** @type {{id: any, icon: any, name: any, type?: string, description: any, requirement: any, current: any, max: any, flags?: any, todo?: boolean, rewardsObj?: any, done?: boolean, bits?: any, bitsDone?: any, pointsToGet?: number, tiers?: any, onToggleTodo?: CallableFunction}} */
	let {
		id,
		icon,
		name,
		type = 'Default',
		description,
		requirement,
		current,
		max,
		flags = [],
		todo = $bindable(false),
		rewardsObj = {},
		done = false,
		bits = [],
		bitsDone = [],
		pointsToGet = 0,
		tiers = [],
		onToggleTodo = () => {},
	} = $props();

	const showApiLinks = getQueryStringFlag('show-api-links');

	let todoState_class = $derived(todo ? 'todo' : '');
	let todoState_title = $derived(todo ? $_('achievements.click_to_remove_todo') : $_('achievements.click_to_add_todo'));
	let _bits = $derived(bits ? bits.length : 0);
	let _bitsDone = $derived(bits ? (done ? bits.length : (bitsDone || []).length) : 0);

	const _title = getTitle();

	function toggleTodo() {
		todo = !todo;
		onToggleTodo({
			id,
			todo,
		});
	}

	function getTitle() {
		let res = '';
		if (bits && bits.length) {
			res = '<ol>';
			bits.forEach((x, idx) => {
				const c = bitsDone.includes(idx) ? 'done' : '';
				res += `<li class="${c}">${x.text}</li>`;
			});
			res += '</ol>';
		} else if (tiers) {
			// ...
		}
		return res;
	}
</script>

<div class="achiev {done ? 'done' : ''}">
	<div class="head autotooltip">
		{#if icon}
			<img src={icon} alt={name} title={_title} />
		{/if}

		{#if current && max}
			<progress value={current <= max ? current : max} {max} title={_title}></progress>
			<span title={_title}>{current <= max ? current : max} / {max}</span>
		{/if}

		{#if flags && flags.includes('Hidden')}
			<img
				class="icon"
				src="{base}/assets/rewards/Achievements_Watch_List.png"
				alt="hidden achievement"
				title={$_('achievements.achievement_is_hidden')}
			/>
		{/if}
		{#if showApiLinks}
			<small><a href="https://api.guildwars2.com/v2/achievements/{id}" target="_blank">id: {id}</a></small>
		{/if}
		<a href={helperUtils.wikiLink(name)} target="_blank" title={$_('common.read_more_on_wiki')}>
			<Wiki width="1.5em" height="1.5em" />
		</a>
	</div>
	<div class="body">
		<div class="title-bar">
			<h3>{name}</h3>
			<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions, a11y_no_static_element_interactions-->
			<div class={`todo-state ${todoState_class}`} title={todoState_title} onclick={toggleTodo}></div>
		</div>
		{#if description}<span>{@html description}</span>{/if}
		{#if requirement}<span>{requirement}</span>{/if}

		<div class="rewards small">
			{#if type == 'ItemSet'}
				<div class="reward-item">
					<img src="{base}/assets/rewards/Talk_collection_option.png" alt="title" title={$_('achievements.achievement_is_collection')} />
				</div>
			{/if}

			{#if rewardsObj.title}
				<div class="reward-item">
					<img src="{base}/assets/rewards/Title_icon.png" alt="title" title={$_('achievements.achievement_is_title')} />
				</div>
			{/if}
			{#if rewardsObj.coins}
				<div class="reward-item">
					<Price value={rewardsObj.coins[0].count} />
				</div>
			{/if}
			{#if rewardsObj.item}
				<div class="reward-item">
					<img src="{base}/assets/rewards/Achievement_Chest_interface_icon.png" alt="item" title={$_('achievements.achievement_is_item')} />
				</div>
			{/if}
			{#if rewardsObj.mastery}
				{#if rewardsObj.mastery.find((x) => x.region == 'Tyria')}
					<div class="reward-item">
						<img
							src="{base}/assets/rewards/Mastery_point_Central_Tyria.png"
							alt="mastery points Central Tyria"
							title={$_('achievements.achievement_is_mastery_tyria')}
						/>
					</div>
				{/if}
				{#if rewardsObj.mastery.find((x) => x.region == 'Maguuma')}
					<div class="reward-item">
						<img
							src="{base}/assets/rewards/Mastery_point_Heart_of_Thorns.png"
							alt="mastery points Heart of Thorns"
							title={$_('achievements.achievement_is_mastery_hot')}
						/>
					</div>
				{/if}
				{#if rewardsObj.mastery.find((x) => x.region == 'Desert')}
					<div class="reward-item">
						<img
							src="{base}/assets/rewards/Mastery_point_Path_of_Fire.png"
							alt="mastery points Path of Fire"
							title={$_('achievements.achievement_is_mastery_pof')}
						/>
					</div>
				{/if}
				{#if rewardsObj.mastery.find((x) => x.region == 'Tundra')}
					<div class="reward-item">
						<img
							src="{base}/assets/rewards/Mastery_point_Icebrood_Saga.png"
							alt="mastery points Icebrood Saga"
							title={$_('achievements.achievement_is_mastery_ice')}
						/>
					</div>
				{/if}
				{#if rewardsObj.mastery.find((x) => x.region == 'Jade')}
					<div class="reward-item">
						<img
							src="{base}/assets/rewards/Mastery_point_End_of_Dragons.png"
							alt="mastery points End of Dragons"
							title={$_('achievements.achievement_is_mastery_eod')}
						/>
					</div>
				{/if}
				{#if rewardsObj.mastery.find((x) => x.region == 'Sky')}
					<div class="reward-item">
						<img
							src="{base}/assets/rewards/Mastery_point_Secrets_of_the_Obscure.png"
							alt="mastery points Secrets of the Obscure"
							title={$_('achievements.achievement_is_mastery_soto')}
						/>
					</div>
				{/if}
				{#if rewardsObj.mastery.find((x) => x.region == 'Unknown')}
					<div class="reward-item">
						<img
							src="{base}/assets/rewards/Mastery_point_Janthir_Wilds.png"
							alt="mastery points Janthir Wilds"
							title={$_('achievements.achievement_is_mastery_jw')}
						/>
					</div>
				{/if}
			{/if}
			{#if pointsToGet}
				<div class="reward-item">
					<span>{pointsToGet}</span>
					<img src="{base}/assets/rewards/AP.png" alt="achievement points" title={$_('achievements.achievement_can_get', { pointsToGet })} />
				</div>
			{/if}
			{#if _bits}
				<div class="reward-item">
					<span>{_bitsDone} / {_bits}</span>
					<img
						src="{base}/assets/rewards/Achievements_Summary.png"
						alt="achievements"
						title={$_('achievements.achievement_tasks_left', { left: _bits - _bitsDone })}
					/>
				</div>
			{/if}
		</div>
	</div>
</div>

<style lang="scss">
	.achiev {
		width: 21em;
		display: flex;
		flex-flow: row nowrap;
		padding: 0.5em;
		row-gap: 0.2em;
		column-gap: 0.6em;

		border-radius: 0.3125em;
		background-color: var(--gw2helper-module-white);
		box-shadow: var(--gw2helper-module-shadow);
		color: var(--gw2helper-module-text);
		flex: 0 1 auto;

		&.done {
			background: var(--gw2helper-module-white) url(/gw2helper/assets/rewards/done.png) top left;
			background-repeat: no-repeat;
			background-size: 1.5em 1.5em;
		}
		&:hover {
			box-shadow: var(--gw2helper-module-shadow-hover);
		}
		.head {
			display: flex;
			flex-flow: column nowrap;
			row-gap: 0.6em;
			width: 25%;
			min-width: 5em;
			justify-content: center;
			align-items: center;
			progress {
				width: 100%;
			}
			span {
				font-size: x-small;
				overflow-wrap: break-word;
			}
			a {
				color: var(--gw2helper-module-text);
			}
			img {
				width: 3em;
				height: 3em;
				&.icon {
					cursor: help;
					width: 1.5em;
					height: 1.5em;
				}
			}
		}
		.body {
			display: flex;
			flex-flow: column nowrap;
			row-gap: 0.6em;
			width: 100%;
			min-height: 7.5em;
			justify-content: space-between;
			font-size: small;
			.title-bar {
				display: flex;
				flex-flow: row nowrap;
				justify-content: space-between;
				align-items: center;
			}
			h3 {
				margin: 0;
				font-size: medium;
			}
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

		.reward-item {
			display: flex;
			flex-flow: row nowrap;
			align-items: center;
			font-size: medium;
			img {
				width: 1.5em;
				height: 1.5em;
			}
		}
	}

	.todo-state {
		background: url(/gw2helper/assets/rewards/map_heart-sprite.png) no-repeat top center;
		padding: 0;
		border-radius: 0;
		margin: 0;
		cursor: pointer;
		width: 24px;
		height: 24px;
		background-size: 24px;
		flex-shrink: 0;
		&.todo {
			background-position-y: -24px;
		}
	}

	:global(li.done) {
		text-decoration: line-through;
		color: var(--gw2helper-not-important);
	}
</style>
