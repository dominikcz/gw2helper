<script>
	import helperUtils from '$lib/utils/helper-utils';
	import { base } from '$app/paths';
	import Price from '$lib/components/price.svelte';
	import { createEventDispatcher } from 'svelte';
	import Wiki from '../wiki.svelte';

	export let id;
	export let icon;
	export let name;
	export let type = 'Default';
	export let description;
	export let requirement;
	export let current;
	export let max;
	export let flags = [];
	export let todo = false;
	export let rewardsObj = {};
	export let done = false;
	export let bits = [];
	export let bitsDone = [];
	export let pointsToGet = 0;

	const dispatch = createEventDispatcher();

	const showApiLinks = new URLSearchParams(window.location.search).get('show-api-links') == '1' ? true : false;

	$: todoState_icon = todo ? `${base}/assets/rewards/map_heart_full.png` : `${base}/assets/rewards/map_heart_empty.png`;
	$: todoState_state = todo ? 'on todo' : 'not on todo';
	$: todoState_title = todo ? 'Click to remove from TODO list' : 'Click to add to TODO list';
	$: _bits = bits ? bits.length : 0;
	$: _bitsDone = bits ? (done ? bits.length : (bitsDone || []).length) : 0;

	function toggleTodo() {
		todo = !todo;
		dispatch('toggle-todo', {
			id,
			todo,
		});
	}
</script>

<div class="achiev {done ? 'done' : ''}">
	<div class="head">
		{#if icon}
			<img src={icon} alt={name} />
		{/if}

		{#if current && max}
			<progress value={current <= max ? current : max} {max} />
			<span>{current <= max ? current : max} / {max}</span>
		{/if}

		{#if flags && flags.includes('Hidden')}
			<img class="icon" src="{base}/assets/rewards/Achievements_Watch_List.png" alt="hidden achievement" title="This is a hidden achievement" />
		{/if}
		{#if showApiLinks}
			<small><a href="https://api.guildwars2.com/v2/achievements/{id}" target="_blank">id: {id}</a></small>
		{/if}
		<a href={helperUtils.wikiLink(name)} target="_blank" title="Read more on GW2 Wiki" >
			<Wiki width="1.5em" height="1.5em" />
		</a>
	</div>
	<div class="body">
		<div class="title-bar">
			<h3>{name}</h3>
			<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions svelte-ignore a11y-no-static-element-interactions-->
			<img src={todoState_icon} alt={todoState_state} title={todoState_title} on:click={toggleTodo} />
		</div>
		{#if description}<span>{@html description}</span>{/if}
		{#if requirement}<span>{requirement}</span>{/if}

		<div class="rewards small">
			{#if type == 'ItemSet'}
				<div class="reward-item">
					<img src="{base}/assets/rewards/Talk_collection_option.png" alt="title" title="This achievement is linked to a collection" />
				</div>
			{/if}

			{#if rewardsObj.title}
				<div class="reward-item">
					<img src="{base}/assets/rewards/Title_icon.png" alt="title" title="This achievement rewards a title" />
				</div>
			{/if}
			{#if rewardsObj.coins}
				<div class="reward-item">
					<Price value={rewardsObj.coins[0].count} />
				</div>
			{/if}
			{#if rewardsObj.item}
				<div class="reward-item">
					<img src="{base}/assets/rewards/Achievement_Chest_interface_icon.png" alt="item" title="This achievement rewards items" />
				</div>
			{/if}
			{#if rewardsObj.mastery}
				{#if rewardsObj.mastery.find((x) => x.region == 'Tyria')}
					<div class="reward-item">
						<img
							src="{base}/assets/rewards/Mastery_point_Central_Tyria.png"
							alt="mastery points Central Tyria"
							title="This achievement rewards Central Tyria mastery points"
						/>
					</div>
				{/if}
				{#if rewardsObj.mastery.find((x) => x.region == 'Maguuma')}
					<div class="reward-item">
						<img
							src="{base}/assets/rewards/Mastery_point_Heart_of_Thorns.png"
							alt="mastery points Heart of Thorns"
							title="This achievement rewards Heart of Thorns mastery points"
						/>
					</div>
				{/if}
				{#if rewardsObj.mastery.find((x) => x.region == 'Desert')}
					<div class="reward-item">
						<img
							src="{base}/assets/rewards/Mastery_point_Path_of_Fire.png"
							alt="mastery points Path of Fire"
							title="This achievement rewards Path of Fire mastery points"
						/>
					</div>
				{/if}
				{#if rewardsObj.mastery.find((x) => x.region == 'Tundra')}
					<div class="reward-item">
						<img
							src="{base}/assets/rewards/Mastery_point_Icebrood_Saga.png"
							alt="mastery points Icebrood Saga"
							title="This achievement rewards Icebrood Saga mastery points"
						/>
					</div>
				{/if}
				{#if rewardsObj.mastery.find((x) => x.region == 'Jade')}
					<div class="reward-item">
						<img
							src="{base}/assets/rewards/Mastery_point_End_of_Dragons.png"
							alt="mastery points End of Dragons"
							title="This achievement rewards End of Dragons mastery points"
						/>
					</div>
				{/if}
				{#if rewardsObj.mastery.find((x) => x.region == 'Sky')}
					<div class="reward-item">
						<img
							src="{base}/assets/rewards/Mastery_point_Secrets_of_the_Obscure.png"
							alt="mastery points Secrets of the Obscure"
							title="This achievement rewards Secrets of the Obscure mastery points"
						/>
					</div>
				{/if}
			{/if}
			{#if pointsToGet}
				<div class="reward-item">
					<span>{pointsToGet}</span>
					<img
						src="{base}/assets/rewards/AP.png"
						alt="achievement points"
						title="You can get {pointsToGet} achievement points from this achievement"
					/>
				</div>
			{/if}
			{#if _bits}
				<div class="reward-item">
					<span>{_bitsDone} / {_bits}</span>
					<img src="{base}/assets/rewards/Achievements_Summary.png" alt="achieves" title="There are {_bits - _bitsDone} tasks left to do" />
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
				svg{
					cursor: pointer;
				}
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
				img {
					cursor: pointer;
					width: 1.5em;
					height: 1.5em;
				}
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
</style>
