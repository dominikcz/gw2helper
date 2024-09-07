<script lang="ts">
	export let title: string;
	export let url: string;
	export let link: string | null = null;
	export let linkTitle: string = '';
	let className : string | null = null;
	export { className as class };
</script>

<div class="widget image {className}" {...$$restProps} style="background-image: url({url})">
	{#if link}
		<a href={link} title={linkTitle || ''} target="_blank">
			<div class="title">{title}</div>
		</a>
	{:else}
		<div class="title">{title}</div>
	{/if}
</div>

<style>
	a {
		display: block;
		text-decoration: none;
		cursor: pointer;
		width: 100%;
		height: 100%;
	}
</style>
