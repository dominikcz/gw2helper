<script>
	import { invalidateAll } from '$app/navigation';
	import { base } from '$app/paths';

	import utils from '$lib/utils.js';
	import '$lib/scss/gw2.scss';

	export let data;
	let apiKey = data.apiKey;
	$: tokenInfo = data.tokenInfo;

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

<header>
	<h1>GW2 Helper</h1>
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
		{#if tokenInfo}
		<br />
		Successfully loaded key "{tokenInfo.name}".
		{/if}
	
	</fieldset>
	
	{#if tokenInfo}
	<nav id="main-nav">
		<a href="{base}/">Home</a>
		{#if tokenInfo.permissions.includes('characters')}
		<a href="{base}/characters/" data-sveltekit-preload-data="tap">Characters</a>
		{/if}
		{#if tokenInfo.permissions.includes('account')}
		<a href="{base}/items/" data-sveltekit-preload-data="tap">Items</a>
		{/if}
		{#if tokenInfo.permissions.includes('inventories')}
		<a href="{base}/materials/" data-sveltekit-preload-data="tap">Materials</a>
		{/if}
	</nav>
	{/if}
</header>

<main>
	<slot />
</main>

<style lang="scss" global>
	header{
		margin: 0 1rem;
	}
	nav {
		margin: 0.5rem 1rem;
		a {
			padding: 0.3rem 1rem;
		}
	}
	main{
		margin: 0 1rem;
	}
</style>