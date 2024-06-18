<script>
	import Awaiter from '$lib/components/awaiter.svelte';
	export let data;
</script>

<h1>Achievements</h1>

<!-- https://api.guildwars2.com/v2/achievements?ids=1840,910,2258 -->

<!-- id - The achievement id.
icon (string, optional) – The achievement icon.
name (string) – The achievement name.
description (string) – The achievement description.
requirement (string) – The achievement requirement as listed in-game.
locked_text (string) – The achievement description prior to unlocking it.
type (string) – The achievement type. Possible values:
    Default - A default achievement.
    ItemSet - Achievement is linked to Collections
flags (array of strings) - Achievement categories. Possible values:
    Pvp - can only get progress in PvP or WvW
    CategoryDisplay - is a meta achievement
    MoveToTop - affects in-game UI collation
    IgnoreNearlyComplete - doesn't appear in the "nearly complete" UI
    Repeatable - can be repeated multiple times
    Hidden - hidden achievement; must fulfil unlock requirements before making progress or showing in the hero panel
    RequiresUnlock - must fulfil unlock requirements before making progress but will show in the hero panel before unlocking
    RepairOnLogin - unknown
    Daily - Flags an achievement as resetting daily.
    Weekly - Flags an achievement as resetting weekly.
    Monthly - Flags an achievement as resetting monthly.
    Permanent - Flags an achievement as progress never reseting.
tiers (array of objects) - Describes the achievement's tiers. Each object contains:
    count (number) - The number of "things" (achievement-specific) that must be completed to achieve this tier.
    points (number) The amount of AP awarded for completing this tier.
prerequisites (array of numbers) (optional) - Contains an array of achievement ids required to progress the given achievement.
rewards (array of objects, optional) - Describes the rewards given for the achievement. Each object contains:
    type (string) - The type of reward. Additional fields appear for different values of type.
        If Coins:
            count (number) - The number of Coins to be rewarded.
        If Item:
            id (number) - The item ID to be rewarded.
            count (number) - The number of id to be rewarded.
        If Mastery:
            id (number) - The mastery point ID to be rewarded.
            region (string) - The region the Mastery Point applies to. Either Tyria, Maguuma, Desert or Tundra.
        If Title:
            id (number) - The title id.
bits (array of objects, optional) - Contains a number of objects, each corresponding to a bitmask value that can give further information on the progress towards the achievement. Each object has the following values:
    type (string) - The type of bit. Can be Text, Item, Minipet, or Skin.
    id (number, optional) - The ID of the item, mini, or skin, if applicable.
    text (string, optional) - The text for the bit, if type is Text.
point_cap (number, optional) - The maximum number of AP that can be rewarded by an achievement flagged as Repeatable. -->

<Awaiter promise={data.achievements} let:result>
	<div class="achiev-list">
		{#each result as achiev (achiev.id)}
			<div class="achiev">
				<div>{achiev.name}</div>
				<div>{achiev.description}</div>
				<div>{achiev.type}</div>
				<div>{achiev.tiers}</div>
				<div>{achiev.rewards}</div>
				<div>{achiev.point_cap}</div>
				<div>{achiev.bits}</div>
				<div>{achiev.current} / {achiev.max}</div>
			</div>
		{/each}
	</div>
</Awaiter>

<style lang="scss">
	.achiev-list {
		display: flex;
        flex-flow: column nowrap;
	}
	.achiev {
		display: flex;
	}
</style>
