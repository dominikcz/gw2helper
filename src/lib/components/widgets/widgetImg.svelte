<script lang="ts">
	interface Props {
		title: string;
		url: string;
		link?: string | null;
		linkTitle?: string;
		class?: string | null;
		active: boolean;
		[key: string]: any
	}

	let {
		title,
		url,
		link = null,
		linkTitle = '',
		class: className = null,
		active = true,
		...rest
	}: Props = $props();

</script>

<div class="widget image {className}" {...rest} >
	{#if link}
		<a href={link} title={linkTitle || ''} target="_blank">
			<div class="title">{title}</div>
			<img src={url} alt="logo" class:active={active}/>
		</a>
	{:else}
		<div class="title">{title}</div>
		<img src={url} alt="logo" class:active={active}/>
	{/if}
</div>

<style lang="scss">
	.widget {
		img {
			filter: grayscale(100%) opacity(50%);
			object-fit: contain;
			width: 100%;
			max-height: calc(100% - 1.5rem);
			&.active{
				filter: none;
			}
		}
	}
	a {
		display: block;
		text-decoration: none;
		cursor: pointer;
		width: 100%;
		height: 100%;
	}
</style>

