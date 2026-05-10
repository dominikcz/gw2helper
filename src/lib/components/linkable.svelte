<script lang="ts">
	interface Props {
		link: string;
		linkTitle?: string;
		children?: import('svelte').Snippet;
		[key: string]: unknown
	}

	let { link, linkTitle = '', children, ...rest }: Props = $props();
</script>

{#if link}
	<a href={link} title={linkTitle || ''} target="_blank" {...rest}>
		{@render children?.()}
	</a>
{:else}
	{@render children?.()}
{/if}

<style>
	a {
		text-decoration: none;
		cursor: pointer;
	}
</style>
