<script lang="ts">
	import helperUtils from '$lib/utils/helper-utils';
	import Awaiter from '$lib/components/awaiter.svelte';
	import WidgetInfo from '$lib/components/widgets/widgetInfo.svelte';
	import WidgetsGroup from '$lib/components/widgets/widgetsGroup.svelte';
	import WidgetImg from '$lib/components/widgets/widgetImg.svelte';
	import { base } from '$app/paths';
	import { _ } from 'svelte-i18n';

	export let data;

	function has(account, content: string): boolean {
		return account.access.includes(content);
	}
</script>

<h1>{$_('account.account_info')}</h1>

<Awaiter promise={data.account} let:result>
	<h3>{result.name}</h3>
	<ul>
		<li>{$_('account.created_at')} <span>{result.created_local}</span></li>
		<li>{$_('account.last_change')} <span>{result.last_modified_local}</span></li>
	</ul>

	<WidgetsGroup name="Time spent">
		<WidgetInfo title={$_('account.hours_played')} value={`${helperUtils.hoursPlayed(result.age)}h`} />
		<WidgetInfo title={$_('account.days')} value={`${helperUtils.diff(result.created)}d`} />
		<WidgetInfo
			title={$_('account.average_time_per_day')}
			value={`${(helperUtils.hoursPlayed(result.age) / helperUtils.diff(result.created)).toFixed(2)}h/day`}
		/>
	</WidgetsGroup>

	<WidgetsGroup name={$_('account.accessible_content')}>
		{#if has(result, 'PlayForFree')}
			<WidgetImg
				title={$_('account.play_for_free')}
				url="{base}/assets/400px-GW2Logo_new.png"
				link="https://wiki.guildwars2.com/wiki/Guild_Wars_2"
				linkTitle={$_('common.read_more_on_wiki')}
				class="autotooltip"
			/>
		{/if}

		{#if has(result, 'GuildWars2')}
			<WidgetImg
				title={$_('account.base_game')}
				url={`${base}/assets/400px-GW2Logo_new.png`}
				link="https://wiki.guildwars2.com/wiki/Guild_Wars_2"
				linkTitle={$_('common.read_more_on_wiki')}
				class="autotooltip"
			/>
		{/if}

		{#if has(result, 'HeartOfThorns')}
			<WidgetImg
				title={$_('account.heart_of_thorns')}
				url={`${base}/assets/400px-HoT_Texture_Centered_Trans.png`}
				link="https://wiki.guildwars2.com/wiki/Guild_Wars_2:_Heart_of_Thorns"
				linkTitle={$_('common.read_more_on_wiki')}
				class="autotooltip"
			/>
		{/if}

		{#if has(result, 'PathOfFire')}
			<WidgetImg
				title={$_('account.path_of_fire')}
				url={`${base}/assets/400px-GW2-PoF_Texture_Centered_Trans.png`}
				link="https://wiki.guildwars2.com/wiki/Guild_Wars_2:_Path_of_Fire"
				linkTitle={$_('common.read_more_on_wiki')}
				class="autotooltip"
			/>
		{/if}

		{#if has(result, 'EndOfDragons')}
			<WidgetImg
				title={$_('account.end_of_dragons')}
				url={`${base}/assets/400px-EoD_Texture_Trans.png`}
				link="https://wiki.guildwars2.com/wiki/Guild_Wars_2:_End_of_Dragons"
				linkTitle={$_('common.read_more_on_wiki')}
				class="autotooltip"
			/>
		{/if}

		{#if has(result, 'SecretsOfTheObscure')}
			<WidgetImg
				title={$_('account.secrets_of_the_obscure')}
				url={`${base}/assets/400px-Secrets_of_the_Obscure_logo.png`}
				link="https://wiki.guildwars2.com/wiki/Guild_Wars_2:_Secrets_of_the_Obscure"
				linkTitle={$_('common.read_more_on_wiki')}
				class="autotooltip"
			/>
		{/if}

		{#if has(result, 'JanthirWilds')}
			<WidgetImg
				title={$_('account.janthir_wilds')}
				url={`${base}/assets/400px-Janthir_Wilds_logo.png`}
				link="https://wiki.guildwars2.com/wiki/Guild_Wars_2:_Janthir_Wilds"
				linkTitle={$_('common.read_more_on_wiki')}
				class="autotooltip"
			/>
		{/if}
	</WidgetsGroup>

	<WidgetsGroup name={$_('account.levels')}>
		<WidgetInfo title={$_('account.fractals')} value={result.fractal_level} image="{base}/assets/rewards/Daily_Fractals.png" />
		<WidgetInfo title="WvW" value={result.wvw_rank} image="{base}/assets/rewards/WvW_Ability_Point.png" />
	</WidgetsGroup>
</Awaiter>
