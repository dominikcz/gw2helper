<script>
	import { autotooltip } from '$lib/actions/autotooltip';
	import Achievement from '$lib/components/achievements/achievement.svelte';
	import { t as _ } from '$lib/services/i18n.js';
	/** @type {{items: any, todoList: any, children?: import('svelte').Snippet}} */
	let { items, todoList, children } = $props();

	function isOnTodo(todoList, achievId){
		return todoList.findIndex((x) => x == achievId) >= 0;
	}

	// console.log('achieveList ' + name, items);
</script>

<div class="achiev-list" use:autotooltip>
	{#each items as achiev (achiev.id)}
		<Achievement
			id={achiev.id}
			icon={achiev.icon}
			name={achiev.name}
			type={achiev.type}
			description={achiev.description}
			requirement={achiev.requirement}
			current={achiev.current}
			max={achiev.max}
			flags={achiev.flags}
			todo={isOnTodo(todoList, achiev.id)}
			rewardsObj={achiev.rewardsObj}
			done={achiev.done}
			bits={achiev.bits}
			bitsDone={achiev.bits_done}
			pointsToGet={achiev.points_to_get}
			on:toggle-todo
		/>
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
</style>
