<script lang="ts" generics="T">
	import Spinner from '$lib/components/branding/gw2spinner.svelte';
	import { invalidateAll } from '$app/navigation';
	import InfoBlock from '$lib/components/infoBlock/infoBlock.svelte';
	import { t as _ } from '$lib/services/i18n';

	interface Props {
		promise: Promise<T> | T;
		children?: import('svelte').Snippet<[T]>;
	}

	let { promise, children }: Props = $props();
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
