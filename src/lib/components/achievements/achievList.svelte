<script>
	import Achievement from '$lib/components/achievements/achievement.svelte';
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
            todo={todoList.findIndex(x => x == achiev.id) >=0}
            rewardsObj={achiev.rewardsObj}
            done={achiev.done}
            bits={achiev.bits}
            bitsDone={achiev.bits_done}
            pointsToGet={achiev.points_to_get}
            on:toggle-todo
        />
    {/each}
</div>

<style lang="scss">
	.achiev-list {
		display: flex;
		flex-flow: row wrap;
		gap: 1rem;
		margin: 0 10px;
	}
</style>