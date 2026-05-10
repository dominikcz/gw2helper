<script lang="ts">
	import helperUtils from '$lib/utils/helper-utils';
	import { asset } from '$app/paths';
	import Wiki from '../wiki.svelte';
	import { getQueryStringFlag } from '$lib/utils';
	import { t as _ } from '$lib/services/i18n';
	import AchievementRewards from './achievementRewards.svelte';
	import { ACHIEVEMENT_LINKS } from './achievements';

	type Tier = {
		count: number;
		points?: number;
	};

	interface RewardsObj {
		title?: unknown;
		coins?: Array<{ count: number }>;
		item?: unknown;
		mastery?: Array<{ region: string }>;
	}

	interface Props {
		id: number;
		icon?: string;
		name: string;
		type?: string;
		description?: string;
		requirement?: string;
		current?: number;
		max?: number;
		flags?: string[];
		todo?: boolean;
		rewardsObj?: RewardsObj;
		done?: boolean;
		bits?: unknown[];
		bitsDone?: number[];
		pointsToGet?: number;
		tiers?: Tier[];
		onToggleTodo?: (event: { id: number; todo: boolean }) => void;
	}

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
	}: Props = $props();

	const showApiLinks = getQueryStringFlag('show-api-links');

	let todoState_class = $derived(todo ? 'todo' : '');
	let todoState_title = $derived(todo ? $_('achievements.click_to_remove_todo') : $_('achievements.click_to_add_todo'));

	let link = $derived(ACHIEVEMENT_LINKS[id as keyof typeof ACHIEVEMENT_LINKS] ? ACHIEVEMENT_LINKS[id as keyof typeof ACHIEVEMENT_LINKS] : name);

	function toggleTodo() {
		todo = !todo;
		onToggleTodo({
			id,
			todo,
		});
	}
</script>

<div class="achiev {done ? 'done' : ''}">
	<div class="head autotooltip" data-autotooltip-renderer="achiev.progress" data-autotooltip-id={id} data-autotooltip-params={JSON.stringify(bitsDone)}>
		{#if icon}
			<img src={icon} alt={name} />
		{/if}

		{#if max}
			<progress value={(current ?? 0) <= max ? (current ?? 0) : max} {max} data-autotooltip-id={id}></progress>
			<span data-autotooltip-id={id}>{(current ?? 0) <= max ? (current ?? 0) : max} / {max}</span>
		{/if}

		{#if flags && flags.includes('Hidden')}
			<img
				class="icon"
				src={asset('/assets/rewards/Achievements_Watch_List.png')}
				alt="hidden achievement"
				title={$_('achievements.achievement_is_hidden')}
			/>
		{/if}
		{#if showApiLinks}
			<small><a href="https://api.guildwars2.com/v2/achievements/{id}" target="_blank">id: {id}</a></small>
		{/if}
		<a href={helperUtils.wikiLink(link)} target="_blank" title={$_('common.read_more_on_wiki')}>
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

		<AchievementRewards {rewardsObj} {type} {pointsToGet} {done} {bits} {bitsDone} />
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
			background: var(--gw2helper-module-white) var(--asset-reward-done) top left;
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

	.todo-state {
		background: var(--asset-map-heart-sprite) no-repeat top center;
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
</style>
