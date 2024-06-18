<script>
	import Spinner from '$lib/components/gw2spinner.svelte';
	import { invalidateAll } from '$app/navigation';
    export let promise;
</script>

{#await promise}
	<Spinner />
{:then result}
	<slot {result} />
{:catch error}
	<p>error loading data: {error.message}</p>
	<button on:click={() => invalidateAll()}>retry</button>
{/await}