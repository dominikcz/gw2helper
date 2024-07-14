<script>
	import helperUtils from '$lib/utils/helper-utils';
	import { base } from '$app/paths';
	import Price from '$lib/components/price.svelte';
	import { createEventDispatcher } from 'svelte';

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

    $: todoState_icon = todo ? `${base}/assets/rewards/map_heart_full.png` : `${base}/assets/rewards/map_heart_empty.png`;
    $: todoState_state = todo ? 'on todo' : 'not on todo';
    $: todoState_title = todo ? 'Click to remove from TODO list' : 'Click to add to TODO list';
    $: _bits = bits ? bits.length : 0
    $: _bitsDone = bits ? (done ? bits.length : (bitsDone ||[]).length) : 0;

    function toggleTodo(){
        todo = !todo;
        dispatch('toggle-todo', {
			id,
            todo
		});
    }

</script>

<div class="achiev">
    <div class="head">
        {#if icon}
            <img src={icon} alt={name} />
        {/if}

        {#if current}
            <progress value={current} max={max} />
            <span>{current} / {max}</span>
        {/if}

        {#if flags && flags.includes('Hidden')}
            <img
                class="icon"
                src="{base}/assets/rewards/Achievements_Watch_List.png"
                alt="hidden achievement"
                title="This is a hidden achievement"
            />
        {/if}
        <small><a href="https://api.guildwars2.com/v2/achievements/{id}" target="_blank">id: {id}</a></small>
        <small
            ><a href={helperUtils.wikiLink(name)} target="_blank"
                ><img src="{base}/assets/wiki.svg" alt="wiki logo" height="24px" title="Read more on GW2 Wiki" /></a
            ></small
        >
    </div>
    <div class="body">
        <div class="title-bar">
            <h3>{name}</h3>
            <!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions svelte-ignore a11y-no-static-element-interactions-->
            <img
                src={todoState_icon}
                alt={todoState_state}
                title={todoState_title}
                on:click={toggleTodo}
            />
        </div>
        {#if description}<span>{description}</span>{/if}
        {#if requirement}<span>{requirement}</span>{/if}

        <div class="rewards small">
            {#if type == 'ItemSet'}
                <div class="reward-item">
                    <img
                        src="{base}/assets/rewards/Talk_collection_option.png"
                        alt="title"
                        title="This achievement is linked to a collection"
                    />
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
                    <img
                        src="{base}/assets/rewards/Achievement_Chest_interface_icon.png"
                        alt="item"
                        title="This achievement rewards items"
                    />
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
            {#if bits}
                <div class="reward-item">
                    <span>{_bitsDone} / {_bits}</span>
                    <img
                        src="{base}/assets/rewards/Achievements_Summary.png"
                        alt="achieves"
                        title="There are {_bits - _bitsDone} tasks left to do"
                    />
                </div>
            {/if}
        </div>
    </div>
</div>

<style lang="scss">
	.achiev {
		width: 335px;
		display: flex;
		flex-flow: row nowrap;
		padding: 0.5rem;
		row-gap: 0.2rem;
		column-gap: 0.6rem;

		border-radius: 5px;
		background-color: var(--gw2helper-module-white);
		box-shadow: var(--gw2helper-module-shadow);
		color: #000;
		flex: 0 1 auto;
		&:hover {
			box-shadow: var(--gw2helper-module-shadow-hover);
		}
		.head {
			display: flex;
			flex-flow: column nowrap;
			row-gap: 0.6rem;
			width: 25%;
			min-width: 80px;
			justify-content: center;
			align-items: center;
			progress {
				width: 100%;
			}
			span {
				font-size: x-small;
				overflow-wrap: break-word;
			}
			small {
				font-size: xx-small;
				img {
					width: 24px;
					height: 24px;
				}
			}
			img {
				width: 48px;
				height: 48px;
				&.icon {
					cursor: help;
					width: 24px;
					height: 24px;
				}
			}
		}
		.body {
			display: flex;
			flex-flow: column nowrap;
			row-gap: 0.6rem;
			width: 100%;
			min-height: 120px;
			justify-content: space-between;
			font-size: small;
			.title-bar {
				display: flex;
				flex-flow: row nowrap;
				justify-content: space-between;
				align-items: center;
				img {
					cursor: pointer;
					width: 24px;
					height: 24px;
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
		column-gap: 0.6rem;
		row-gap: 0.2rem;
		// font-family: monospace;

		.reward-item {
			display: flex;
			flex-flow: row nowrap;
			align-items: center;
			font-size: medium;
			img {
				width: 24px;
				height: 24px;
			}
		}
	}

</style>