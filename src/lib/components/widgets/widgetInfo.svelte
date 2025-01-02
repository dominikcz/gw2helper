<script lang="ts">
	interface Props {
		title: string;
		value: string;
		image?: string;
		children?: import('svelte').Snippet<[any]>;
		[key: string]: any
	}

	let {
		title,
		value,
		image = '',
		children,
		...rest
	}: Props = $props();

	function getImageStyle() {
		return image ? `background-image: url(${image});` : '';
	}

</script>

<div class="widget" style={getImageStyle()} {...rest}>
	<div class="title">{title}</div>
	<div class="value">
		{#if children}{@render children({ value, })}{:else}
			{value}
		{/if}
	</div>
</div>
