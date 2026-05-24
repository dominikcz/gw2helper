<script lang="ts">
	import helperUtils from '$lib/utils/helper-utils';
	import Awaiter from '$lib/components/ui/awaiter.svelte';
	import WidgetInfo from '$lib/components/widgets/widgetInfo.svelte';
	import WidgetsGroup from '$lib/components/widgets/widgetsGroup.svelte';
	import WidgetImg from '$lib/components/widgets/widgetImg.svelte';
	import { asset } from '$app/paths';
	import { t as _ } from '$lib/services/i18n';
	import InfoBlock from '$lib/components/infoBlock/infoBlock.svelte';
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import type { AccountWithLocalDates } from '$lib/types/gw2-api';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	let perm = $state<string[]>([]);

	const expansions: Array<{
		access: string;
		titleKey: string;
		imgFile: string;
		wikiSlug: string;
		showOnlyWhenOwned?: boolean;
	}> = [
		{ access: 'PlayForFree', titleKey: 'account.play_for_free', imgFile: '400px-GW2Logo_new.png', wikiSlug: 'Guild_Wars_2', showOnlyWhenOwned: true },
		{ access: 'GuildWars2', titleKey: 'account.base_game', imgFile: '400px-GW2Logo_new.png', wikiSlug: 'Guild_Wars_2', showOnlyWhenOwned: true },
		{ access: 'HeartOfThorns', titleKey: 'account.heart_of_thorns', imgFile: '400px-HoT_Texture_Centered_Trans.png', wikiSlug: 'Guild_Wars_2:_Heart_of_Thorns' },
		{ access: 'PathOfFire', titleKey: 'account.path_of_fire', imgFile: '400px-GW2-PoF_Texture_Centered_Trans.png', wikiSlug: 'Guild_Wars_2:_Path_of_Fire' },
		{ access: 'EndOfDragons', titleKey: 'account.end_of_dragons', imgFile: '400px-EoD_Texture_Trans.png', wikiSlug: 'Guild_Wars_2:_End_of_Dragons' },
		{ access: 'SecretsOfTheObscure', titleKey: 'account.secrets_of_the_obscure', imgFile: '400px-Secrets_of_the_Obscure_logo.png', wikiSlug: 'Guild_Wars_2:_Secrets_of_the_Obscure' },
		{ access: 'JanthirWilds', titleKey: 'account.janthir_wilds', imgFile: '400px-Janthir_Wilds_logo.png', wikiSlug: 'Guild_Wars_2:_Janthir_Wilds' },
		{ access: 'VisionsOfEternity', titleKey: 'account.visions_of_eternity', imgFile: '400px-Visions_of_Eternity_logo.png', wikiSlug: 'Guild_Wars_2:_Visions_of_Eternity' },
	];

	function has(account: { access: string[] }, content: string): boolean {
		return account.access.includes(content);
	}

	onMount(async () => {
		perm = await data.tokenInfo.permissions;
	});
</script>

<h1>{$_('account.account_info')}</h1>

<Awaiter promise={data.account as Promise<AccountWithLocalDates> | AccountWithLocalDates}>
	{#snippet children(result: AccountWithLocalDates)}
		<h3>{result.name}</h3>
		<ul>
			<li>{$_('account.created_at')} <span>{result.created_local}</span></li>
			<li>{$_('account.last_change')} <span>{result.last_modified_local}</span></li>
		</ul>

		<WidgetsGroup name={$_('account.time_spent')}>
			<WidgetInfo title={$_('account.hours_played')} value={`${helperUtils.hoursPlayed(result.age)}h`} />
			<WidgetInfo title={$_('account.days')} value={`${helperUtils.diff(result.created)}d`} />
			<WidgetInfo
				title={$_('account.average_time_per_day')}
				value={`${(helperUtils.hoursPlayed(result.age) / helperUtils.diff(result.created)).toFixed(2)}h/day`}
			/>
		</WidgetsGroup>

		<WidgetsGroup name={$_('account.accessible_content')}>
			{#each expansions as exp}
				{#if !exp.showOnlyWhenOwned || has(result, exp.access)}
					<WidgetImg
						title={$_(exp.titleKey)}
						url={asset(`/assets/${exp.imgFile}`)}
						link={`https://wiki.guildwars2.com/wiki/${exp.wikiSlug}`}
						linkTitle={$_('common.read_more_on_wiki')}
						class="autotooltip"
						active={has(result, exp.access)}
					/>
				{/if}
			{/each}
		</WidgetsGroup>

		{#if perm.includes('progression')}
			<WidgetsGroup name={$_('account.levels')}>
				<WidgetInfo title={$_('account.fractals')} value={result.fractal_level ?? 0} image={asset('/assets/rewards/Daily_Fractals.png')} />
				<WidgetInfo title="WvW" value={result.wvw_rank ?? 0} image={asset('/assets/rewards/WvW_Ability_Point.png')} />
			</WidgetsGroup>
		{:else}
			<InfoBlock caption={$_('account.info.hint')}>{@html $_('account.info.hint-content')}</InfoBlock>
		{/if}
	{/snippet}
</Awaiter>

