<script>
    import wxdates from '$lib/wxjs_dates';
    import WizardsVaultObjective from "$lib/components/wizardsVault/wizardsVaultObjective.svelte";

    export let data;
    export let targetTime;
    export let title;

    function timeLeft(target){
        return wxdates.friendlyDurationTill(new Date(), target);
    }

    function notClaimed(){
        return data.objectives.filter(x => !x.claimed).length;
    }

    console.log(`${title}: ${targetTime.toISOString()}`);
</script>

<details>
    <summary>{title} 
        {#if data.meta_progress_current}
        <progress value={data.meta_progress_current} max={data.meta_progress_complete}/>
        {:else}
        <span>{notClaimed()} objectives left</span>
        {/if} 
        <div class="timer">{timeLeft(targetTime)}</div></summary>
    <article>
        {#each data.objectives as value}
        <WizardsVaultObjective {value} />
        {/each}
    </article>
</details>

<style lang="scss">
    article {
        display: flex;
        flex-flow: column nowrap;
        row-gap: 0.4em;
    }
</style>