<script>
	import Achievement from '$lib/components/achievements/achievement.svelte';
	import { base } from '$app/paths';
	export let items;
	export let todoList;
</script>

<div class="achiev-list">
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
			todo={todoList.findIndex((x) => x == achiev.id) >= 0}
			rewardsObj={achiev.rewardsObj}
			done={achiev.done}
			bits={achiev.bits}
			bitsDone={achiev.bits_done}
			pointsToGet={achiev.points_to_get}
			on:toggle-todo
		/>
	{:else}
		<span class="no-results"
			>You have not added anything to the list yet. Add items by clicking <img src="{base}/assets/rewards/map_heart_empty.png" alt="not on list" class="icon-small"/> icon on list of achievements.</span
		>
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
