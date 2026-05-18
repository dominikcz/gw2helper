<script lang="ts">
	import helperUtils from '$lib/utils/helper-utils';
	import { asset, resolve } from '$app/paths';
	import { dragHandle } from 'svelte-dnd-action';
	import Wiki from '$lib/components/ui/wiki.svelte';
	import { getQueryStringFlag } from '$lib/utils';
	import { t as _ } from '$lib/services/i18n';
	import AchievementRewards from './achievementRewards.svelte';
	import { ACHIEVEMENT_LINKS } from './achievements';
	import type { RewardsObj } from '$lib/types/achievements';

	type Tier = {
		count: number;
		points?: number;
	};

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
		showTooltip?: boolean;
		showDetailsLink?: boolean;
		showDragHandle?: boolean;
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
		showTooltip = true,
		showDetailsLink = true,
		showDragHandle = false,
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

	function openWiki() {
		window.open(helperUtils.wikiLink(link), '_blank', 'noopener,noreferrer');
	}
</script>

<div class="achiev {done ? 'done' : ''}">
	{#if showDragHandle}
		<span class="drag-handle" use:dragHandle aria-label={`drag-handle for ${name}`} title="Drag to reorder">⋮⋮</span>
	{/if}
	<div
		class="head"
		class:autotooltip={showTooltip}
		data-autotooltip-renderer={showTooltip ? 'achiev.progress' : undefined}
		data-autotooltip-id={showTooltip ? id : undefined}
		data-autotooltip-params={showTooltip ? JSON.stringify(bitsDone) : undefined}
	>
		{#if icon}
			<img src={icon} alt={name} />
		{/if}

		{#if max}
			<progress value={(current ?? 0) <= max ? (current ?? 0) : max} {max} data-autotooltip-id={showTooltip ? id : undefined}></progress>
			<span data-autotooltip-id={showTooltip ? id : undefined}>{(current ?? 0) <= max ? (current ?? 0) : max} / {max}</span>
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
			<small>
				<a href={`https://api.guildwars2.com/v2/achievements/${id}`} target="_blank" rel="noopener noreferrer">id: {id}</a>
			</small>
		{/if}
		{#if showDetailsLink}
			<a class="achiev-details" href={resolve(`/achievements/${id}/`)} title={$_('achievements.view_details')}>
				{$_('achievements.details')}
			</a>
		{/if}
		<button type="button" class="wiki-btn" title={$_('common.read_more_on_wiki')} onclick={openWiki}>
			<Wiki width="1.5em" height="1.5em" />
		</button>
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
		position: relative;
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
		.drag-handle {
			position: absolute;
			left: 0.2em;
			top: 0.15em;
			cursor: grab;
			font-size: 0.85em;
			line-height: 1;
			padding: 0.1em 0.25em;
			border-radius: 0.2em;
			background: rgba(0, 0, 0, 0.08);
			z-index: 1;
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
			.achiev-details {
				font-size: small;
				text-decoration: underline;
			}
			.wiki-btn {
				border: 0;
				background: transparent;
				cursor: pointer;
				padding: 0;
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
