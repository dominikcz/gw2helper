<script>
	import '$lib/scss/gw2.scss';
	import { base } from '$app/paths';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import BackToTop from '$lib/components/backToTop.svelte';
	import SearchInput from '$lib/components/searchInput.svelte';

	import utils from '$lib/utils.js';

	import Navigation from '$lib/components/navigation.svelte';
	import AutoTooltip from '$lib/components/autoTooltip.svelte';

	export let data;
	const defaultTitle = 'GW2 Helper';
	let apiKey = data.apiKey;
	$: tokenInfo = data.tokenInfo;
	$: active = $page.url.pathname;
	$: title = [defaultTitle, active.replace(base, '').replaceAll('/', '')].filter(Boolean).join(' - ');

	$: navigation = [
		{ slug: `${base}/`, label: 'Home', visible: tokenInfo.permissions.includes('account') },
		{ slug: `${base}/daily/`, label: 'Daily', visible: tokenInfo.permissions.includes('account') },
		{ slug: `${base}/events/`, label: 'Event timers', visible: true },
		{ slug: `${base}/guilds/`, label: 'Guilds', visible: tokenInfo.permissions.includes('guilds') },
		{ slug: `${base}/characters/`, label: 'Characters', visible: tokenInfo.permissions.includes('characters') },
		{ slug: `${base}/items/`, label: 'Items', visible: tokenInfo.permissions.includes('account') },
		{ slug: `${base}/materials/`, label: 'Materials', visible: tokenInfo.permissions.includes('inventories') },
		{ slug: `${base}/achievements/`, label: 'Achievements', visible: tokenInfo.permissions.includes('progression') },
	];

	$: currentPageVisible = navigation.find((x) => x.slug == active)?.visible || false;

	async function saveApiKey() {
		if (data.apiService) {
			const _token = await data.apiService?.tokenInfo();
			_token.permissions = null;
			console.log('aaaa', _token);
			if (_token.permissions.length) {
				await utils.saveApiKey(apiKey);
				invalidateAll();
			} else {
				tokenInfo.error = `Token "${_apiKey}" is invalid`;
			}
		}
	}

	async function deleteApiKey() {
		apiKey = '';
		await utils.deleteApiKey();
		invalidateAll();
	}

	async function refresh() {
		if (data.apiService) {
			await data.apiService.clearCache();
		}
		location.reload(true);
	}
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

<AutoTooltip />

<div id="content-wrapper">
	<div id="content">
		<header>
			<img src="{base}/assets/heart.png" alt="logo" />
			<div class="line">
				<h1>GW2 Helper</h1>
				<small>v{data.version}</small>
			</div>
		</header>
		<Navigation items={navigation} {active} />

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
					<SearchInput
						name="api-key"
						id="api-key"
						class="apikey"
						placeholder="Paste your API key here"
						bind:value={apiKey}
						options={data.apiKeyHist}
					/>
					<button on:click={() => saveApiKey()}>Apply</button>
					<button on:click={() => deleteApiKey()}>Forget stored key</button>
					<button on:click={refresh}>Clear cache & reload</button>
					{#if tokenInfo.name}
						<p><em>Successfully loaded key "{tokenInfo.name}".</em></p>
					{/if}
					{#if tokenInfo.error}
						<p><em>{@html tokenInfo.error}</em></p>
					{/if}
				</fieldset>
			</details>
		</section>

		{#if tokenInfo.name || currentPageVisible}
			<main>
				<slot />
			</main>
		{/if}

		<BackToTop>
			<div class="waypoint" title="waypoint to top"></div>
		</BackToTop>
	</div>
	<footer>
		<p>
			This unofficial site includes art and other assets that are © 2015 ArenaNet, Inc. All rights reserved. All other trademarks are the property of
			their respective owners. This site uses also images and data from <a href="https://wiki.guildwars2.com/">Guild Wars 2 Wiki</a>
		</p>
		<p>
			© ArenaNet LLC. All rights reserved. NCSOFT, ArenaNet, Guild Wars, Guild Wars 2, GW2, Guild Wars 2: Heart of Thorns, Guild Wars 2: Path of Fire,
			Guild Wars 2: End of Dragons, and Guild Wars 2: Secrets of the Obscure and all associated logos, designs, and composite marks are trademarks or
			registered trademarks of NCSOFT Corporation.
		</p>
	</footer>
</div>

<style lang="scss" global>
	.line {
		display: flex;
		flex-flow: row nowrap;
		column-gap: 1em;
		align-items: baseline;
	}
	#api-key {
		margin: 0.4em 0;
	}
	em {
		color: var(--gw2helper-not-important);
	}
	header {
		margin: 0;
		background-color: #222;
		color: rgb(214, 211, 205);
		min-height: 3.375em;
		display: flex;
		flex-flow: row nowrap;
		align-items: center;
		column-gap: 0.5em;
		h1 {
			margin: 0;
			text-wrap: nowrap;
		}
		img {
			margin-left: 0.625em;
			float: left;
			height: 2em;
		}
	}
	main {
		margin: 0 0.6em 1em 0.6em;
		display: flex;
		flex-flow: column nowrap;
		row-gap: 1em;
	}
	.waypoint {
		width: 4em;
		height: 4em;
		background: url(/gw2helper/assets/waypoint-sprite.png) no-repeat top center;
		padding: 0;
		border-radius: 0;
		margin: 0;
		&:hover {
			background-position-y: -4em;
		}
	}
	.autotooltip-wide {
		width: 18.75em;
	}

	#content-wrapper {
		display: flex;
		flex-flow: column nowrap;
		justify-content: space-between;
		min-height: 100vh;
		gap: 0;
	}
	footer {
		background-color: var(--gw2helper-module-dark);
		font-size: smaller;
		padding: 0.3em 1em;
		width: 100%;
	}
</style>
