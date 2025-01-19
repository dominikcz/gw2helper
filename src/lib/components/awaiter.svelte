<script>
	import Spinner from '$lib/components/gw2spinner.svelte';
	import { invalidateAll } from '$app/navigation';
	import InfoBlock from './infoBlock/infoBlock.svelte';
    import { t as _ } from "$lib/services/i18n";
	/** @type {{promise: any, children?: import('svelte').Snippet<[any]>}} */
	let { promise, children } = $props();
</script>

{#await promise}
	<Spinner />
{:then result}
	{@render children?.(result)}
{:catch error}
	{@const caption = error.name == "ScopeError" ? $_("layout.token_error") : $_("layout.network_error")}
	<InfoBlock {caption} kind="error">
		{error.message}
		{#if error.name !== "ScopeError"}
		<p style="text-align: right;"><button onclick={() => invalidateAll()}>{$_("layout.retry")}</button></p>
		{/if}
	</InfoBlock>
{/await}