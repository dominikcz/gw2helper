<script lang="ts">
	import helperUtils from '$lib/utils/helper-utils';
	import Awaiter from '$lib/components/awaiter.svelte';
	import WidgetInfo from '$lib/components/widgetInfo.svelte';
	import WidgetsGroup from '$lib/components/widgetsGroup.svelte';
	import WidgetImg from '$lib/components/widgetImg.svelte';
	import { base } from '$app/paths';
	export let data;

	function has(account, content: string): boolean {
		return account.access.includes(content);
	}
</script>

<h1>Account info</h1>

<Awaiter promise={data.account} let:result>
	<h3>{result.name}</h3>
	<ul>
		<li>Created at: <span>{result.created_local}</span></li>
		<li>Last change: <span>{result.last_modified_local}</span></li>
	</ul>

	<WidgetsGroup name="Time spent">
		<WidgetInfo title="Hours played" value={`${helperUtils.hoursPlayed(result.age)}h`} />
		<WidgetInfo title="Days" value={`${helperUtils.diff(result.created)}h`} />
		<WidgetInfo title="Average time per day" value={`${(helperUtils.hoursPlayed(result.age) / helperUtils.diff(result.created)).toFixed(2)}h/day`} />
	</WidgetsGroup>

	<WidgetsGroup name="Accessible content">
		{#if has(result, 'PlayForFree')}
			<WidgetImg
				title="Play for free"
				url="{base}/assets/400px-GW2Logo_new.png"
				link="https://wiki.guildwars2.com/wiki/Guild_Wars_2"
				linkTitle="Read more on wiki"
				class="autotooltip"
			/>
		{/if}

		{#if has(result, 'GuildWars2')}
			<WidgetImg
				title="Base game"
				url={`${base}/assets/400px-GW2Logo_new.png`}
				link="https://wiki.guildwars2.com/wiki/Guild_Wars_2"
				linkTitle="Read more on wiki"
				class="autotooltip"
			/>
		{/if}

		{#if has(result, 'HeartOfThorns')}
			<WidgetImg
				title="Heart Of Thorns"
				url={`${base}/assets/400px-HoT_Texture_Centered_Trans.png`}
				link="https://wiki.guildwars2.com/wiki/Guild_Wars_2:_Heart_of_Thorns"
				linkTitle="Read more on wiki"
				class="autotooltip"
			/>
		{/if}

		{#if has(result, 'PathOfFire')}
			<WidgetImg
				title="Path Of Fire"
				url={`${base}/assets/400px-GW2-PoF_Texture_Centered_Trans.png`}
				link="https://wiki.guildwars2.com/wiki/Guild_Wars_2:_Path_of_Fire"
				linkTitle="Read more on wiki"
				class="autotooltip"
			/>
		{/if}

		{#if has(result, 'EndOfDragons')}
			<WidgetImg
				title="End Of Dragons"
				url={`${base}/assets/400px-EoD_Texture_Trans.png`}
				link="https://wiki.guildwars2.com/wiki/Guild_Wars_2:_End_of_Dragons"
				linkTitle="Read more on wiki"
				class="autotooltip"
			/>
		{/if}

		{#if has(result, 'SecretsOfTheObscure')}
			<WidgetImg
				title="Secrets of the Obscure"
				url={`${base}/assets/400px-Secrets_of_the_Obscure_logo.png`}
				link="https://wiki.guildwars2.com/wiki/Guild_Wars_2:_Secrets_of_the_Obscure"
				linkTitle="Read more on wiki"
				class="autotooltip"
			/>
		{/if}

		{#if has(result, 'JanthirWilds')}
			<WidgetImg
				title="Janthir Wilds"
				url={`${base}/assets/400px-Janthir_Wilds_logo.png`}
				link="https://wiki.guildwars2.com/wiki/Guild_Wars_2:_Janthir_Wilds"
				linkTitle="Read more on wiki"
				class="autotooltip"
			/>
		{/if}
	</WidgetsGroup>

	<WidgetsGroup name="Levels">
		<WidgetInfo title="Fractals" value={result.fractal_level} image="{base}/assets/rewards/Daily_Fractals.png" />
		<WidgetInfo title="WvW" value={result.wvw_rank} image="{base}/assets/rewards/WvW_Ability_Point.png" />
	</WidgetsGroup>
</Awaiter>
