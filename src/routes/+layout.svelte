<script>
	import { base } from '$app/paths';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import BackToTop from '$lib/components/backToTop.svelte';
	import SearchInput from '$lib/components/searchInput.svelte';

	import utils from '$lib/utils.js';

	import '$lib/scss/gw2.scss';
	import Navigation from '$lib/components/navigation.svelte';
	import AutoTooltip from '$lib/components/autoTooltip.svelte';

	export let data;
	const defaultTitle = 'GW2 Helper';
	let apiKey = data.apiKey;
	$: tokenInfo = data.tokenInfo;
	$: active = $page.url.pathname;
	$: title = [defaultTitle, active.replace(base, '').replaceAll('/', '')].filter(Boolean).join(' - ');

	$: navigation = [
		{ slug: `${base}/`, label: 'Home', visible: true },
		{ slug: `${base}/daily/`, label: 'Daily', visible: true },
		{ slug: `${base}/events/`, label: 'Event timers', visible: true },
		{ slug: `${base}/guilds/`, label: 'Guilds', visible: tokenInfo.permissions.includes('guilds') },
		{ slug: `${base}/characters/`, label: 'Characters', visible: tokenInfo.permissions.includes('characters') },
		{ slug: `${base}/items/`, label: 'Items', visible: tokenInfo.permissions.includes('account') },
		{ slug: `${base}/materials/`, label: 'Materials', visible: tokenInfo.permissions.includes('inventories') },
		{ slug: `${base}/achievements/`, label: 'Achievements', visible: tokenInfo.permissions.includes('progression') },
	];

	function saveApiKey() {
		utils.saveApiKey(apiKey);
		invalidateAll();
	}

	function deleteApiKey() {
		apiKey = '';
		utils.deleteApiKey();
		invalidateAll();
	}

	function refresh() {
		if (data.apiService) {
			data.apiService.clearCache();
		}
		location.reload(true);
	}
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<AutoTooltip />

<header>
	<img src="{base}/assets/heart.png" alt="logo" />
	<div class="line">
		<h1>GW2 Helper</h1>
		<small>v{data.version}</small>
	</div>
</header>
{#if tokenInfo}
	<Navigation items={navigation} {active} />
{/if}

<section>
	<details open={!tokenInfo.name}>
		<summary>API Settings</summary>
		<fieldset id="settings">
			<legend>API settings</legend>
			<p>
				In order to use this site you have to provide an API key for your account. API keys may be created or deleted at <a
					href="https://account.arena.net/applications">https://account.arena.net/applications.</a
				>.
			</p>
			<label for="api-key">Your API key:</label>
			<SearchInput name="api-key" id="api-key" class="apikey" placeholder="Paste your API key here" bind:value={apiKey} options={utils.getKeyHist()} />
			<button on:click={() => saveApiKey()}>Apply</button>
			<button on:click={() => deleteApiKey()}>Forget stored key</button>
			<button on:click={refresh}>Clear cache & reload</button>
			{#if tokenInfo.name}
				<p><em>Successfully loaded key "{tokenInfo.name}".</em></p>
			{/if}
		</fieldset>
	</details>
</section>

{#if tokenInfo.name}
	<main>
		<slot />
	</main>
{/if}

<BackToTop>
	<div class="waypoint" title="waypoint to top"></div>
</BackToTop>

<footer>
	<p>This unofficial site includes art and other assets that are © 2015 ArenaNet, Inc. All rights reserved. All other trademarks are the property of their respective owners. This site uses also images and data from <a href="https://wiki.guildwars2.com/">Guild Wars 2 Wiki</a></p>
	<p>© ArenaNet LLC. All rights reserved. NCSOFT, ArenaNet, Guild Wars, Guild Wars 2, GW2, Guild Wars 2: Heart of Thorns, Guild Wars 2: Path of Fire, Guild Wars 2: End of Dragons, and Guild Wars 2: Secrets of the Obscure and all associated logos, designs, and composite marks are trademarks or registered trademarks of NCSOFT Corporation.</p>
</footer>

<style lang="scss" global>
	.line {
		display: flex;
		flex-flow: row nowrap;
		column-gap: 1rem;
		align-items: baseline;
	}
	#api-key {
		margin: 0.4rem 0;
	}
	em {
		color: var(--gw2helper-not-important);
	}
	header {
		margin: 0;
		background-color: #222;
		color: rgb(214, 211, 205);
		min-height: 54px;
		display: flex;
		flex-flow: row nowrap;
		align-items: center;
		column-gap: 0.5rem;
		h1 {
			margin: 0;
			text-wrap: nowrap;
		}
		img {
			margin-left: 10px;
			float: left;
		}
	}
	main {
		margin: 0 1rem;
		display: flex;
		flex-flow: column nowrap;
		row-gap: 1rem;
	}
	.waypoint {
		width: 64px;
		height: 64px;
		background: url(/gw2helper/assets/waypoint.png) no-repeat center center;
		padding: 1rem 0.5rem;
		border-radius: 10px;
		margin: 0;
		&:hover {
			background-image: url(/gw2helper/assets/waypoint-hover.png);
		}
	}
	#settings{
		background: url(/gw2helper/assets/150px-construction.png) center right no-repeat;
	}
	.autotooltip-wide{
		width: 300px;
	}
	footer{
		background-color: #aaa;
		font-size: smaller;
		padding: 0.3rem 1rem;
	}
</style>
