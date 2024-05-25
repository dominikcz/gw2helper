<script>
	import { invalidateAll } from '$app/navigation';
	import { base } from '$app/paths';

	import utils from '$lib/utils.js';
	import '$lib/scss/gw2.scss';

	export let data;
	let apiKey = data.apiKey;

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
</fieldset>

<nav id="main-nav">
	<a href="{base}/">Home</a>
	<a href="{base}/characters/">Characters</a>
	<a href="{base}/items/">items</a>
</nav>

<main>
	<slot />
</main>
