<script>
	import { base } from '$app/paths';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import BackToTop from '$lib/components/backToTop.svelte';

	import utils from '$lib/utils.js';
	import '$lib/scss/gw2.scss';
	import Navigation from '$lib/components/navigation.svelte';

	export let data;
	const defaultTitle = 'GW2 Helper';
	let apiKey = data.apiKey;
	$: tokenInfo = data.tokenInfo;
	$: active = $page.url.pathname;
	$: title = [defaultTitle, active.replace(base, '').replaceAll('/', '')].filter(Boolean).join(' - ');

	$: navigation = [
		{ slug: `${base}/`, label: 'Home', visible: true },
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
		invalidateAll();
	}
</script>

<svelte:head>
	<title>{title}</title>
</svelte:head>

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
		<fieldset>
			<legend>API settings</legend>
			<p>
				In order to use this site you have to provide an API key for your account. API keys may be created or deleted at <a
					href="https://account.arena.net/applications">https://account.arena.net/applications.</a
				>.
			</p>
			<label for="api-key">Your API key:</label>
			<input type="text" name="api-key" id="api-key" class="apikey" placeholder="Paste your API key here" bind:value={apiKey} />
			<button on:click={() => saveApiKey()}>Apply</button>
			<button on:click={() => deleteApiKey()}>Forget stored key</button>
			<button on:click={refresh}>refresh</button>
			{#if tokenInfo.name}
				<br />
				Successfully loaded key "{tokenInfo.name}".
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
	<h1>🔝</h1>
</BackToTop>

<style lang="scss" global>
	.line {
		display: flex;
		flex-flow: row nowrap;
		column-gap: 1rem;
		align-items: baseline;
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
	.back-to-top h1{
		background-color: rgba(255,255,255, 0.7);
		padding: 1rem 0.5rem;
		border-radius: 10px;
		margin: 0;
		&:hover{
			background-color: rgba(255,255,255, 1);
		}
	}
</style>
