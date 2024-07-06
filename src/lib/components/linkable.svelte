<script lang="ts">
	export let link: string;
	export let linkTitle: string = '';
</script>

{#if link}
	<a href={link} title={linkTitle || ''} target="_blank" {...$$restProps}>
		<slot />
	</a>
{:else}
	<slot />
{/if}

<style>
	a {
		text-decoration: none;
		cursor: pointer;
	}
</style>
