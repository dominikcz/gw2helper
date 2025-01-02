<script>
	import Spinner from '$lib/components/gw2spinner.svelte';
	import { invalidateAll } from '$app/navigation';
	/** @type {{promise: any, children?: import('svelte').Snippet<[any]>}} */
	let { promise, children } = $props();
</script>

{#await promise}
	<Spinner />
{:then result}
	{@render children?.(result)}
{:catch error}
	<p>error loading data: {error.message}</p>
	<button onclick={() => invalidateAll()}>retry</button>
{/await}