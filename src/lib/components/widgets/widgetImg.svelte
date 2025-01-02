<script lang="ts">
	interface Props {
		title: string;
		url: string;
		link?: string | null;
		linkTitle?: string;
		class?: string | null;
		[key: string]: any
	}

	let {
		title,
		url,
		link = null,
		linkTitle = '',
		class: className = null,
		...rest
	}: Props = $props();
	
</script>

<div class="widget image {className}" {...rest} style="background-image: url({url})">
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
