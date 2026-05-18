<script lang="ts">
	import { autotooltip } from '$lib/actions/autotooltip';
	import { dragHandleZone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import Achievement from '$lib/components/achievements/achievement.svelte';
	import { t as _ } from '$lib/services/i18n';
	import { achievProgressRenderer } from './achievRenderers';
	import type { AchievementLike } from './achievements';

	interface Props {
		items: AchievementLike[];
		todoList: number[];
		onToggleTodo?: (event: { id: number; todo: boolean }) => void;
		onReorder?: (event: { order: number[] }) => void;
		children?: import('svelte').Snippet;
	}

	let {
		items = $bindable([]),
		todoList,
		onToggleTodo,
		onReorder = () => {},
		children = undefined,
	}: Props = $props();
	let todoSet = $derived(new Set(todoList));
	const flipDurationMs = 200;

	// console.log('achieveList ' + name, items);
	const tooltipOptions = {
		customRenderers: {
			'achiev.progress': achievProgressRenderer,
		},
	};	

	function handleConsider(event: CustomEvent<{ items: AchievementLike[] }>) {
		items = event.detail.items;
	}

	function handleFinalize(event: CustomEvent<{ items: AchievementLike[] }>) {
		items = event.detail.items;
		onReorder({
			order: items.map((x) => Number(x.id)).filter((x) => Number.isFinite(x) && x > 0),
		});
	}

</script>

<div class="achiev-list" use:autotooltip={tooltipOptions} use:dragHandleZone={{ items, flipDurationMs }} onconsider={handleConsider} onfinalize={handleFinalize}>
	{#each items as achiev (achiev.id)}
		<div class="achiev-item" animate:flip={{ duration: flipDurationMs }}>
			<Achievement
				id={achiev.id ?? 0}
				icon={achiev.icon}
				name={achiev.name}
				type={achiev.type}
				description={achiev.description}
				requirement={achiev.requirement}
				current={achiev.current}
				max={achiev.max}
				flags={achiev.flags}
				todo={todoSet.has(achiev.id ?? 0)}
				rewardsObj={achiev.rewardsObj}
				done={achiev.done}
				bits={achiev.bits}
				bitsDone={achiev.bits_done}
				pointsToGet={achiev.points_to_get}
				tiers={achiev.tiers as Array<{ count: number; points?: number }>}
				showDragHandle={true}
				{onToggleTodo}
			/>
		</div>
	{:else}
		<span class="no-results">
			{#if children}{@render children()}{:else}{$_('common.nothing_found')}{/if}
		</span>
	{/each}
</div>

<style lang="scss">
	.achiev-list {
		display: flex;
		flex-flow: row wrap;
		gap: 1em;
		margin: 0 0.625em;
	}

	.achiev-item {
		display: flex;
		flex: 0 1 auto;
	}
</style>
