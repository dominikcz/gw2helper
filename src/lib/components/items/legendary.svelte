<script lang="ts">
	import helperUtils from '$lib/utils/helper-utils';
	interface Props {
		item: object;
	}

	let { item }: Props = $props();
</script>

<figure data-autotooltip-renderer="img.item" data-autotooltip-id={item.id}>
	<a href={helperUtils.wikiLink(item.name)} target="_blank">
		<img alt={item.name} src={item.icon} class:locked={!item.count} />
	</a>
	{#if item.count && item.count !== item.max_count}<figcaption>{item.count}/{item.max_count}</figcaption>{/if}
</figure>

<style lang="scss">
	figure {
		width: 3.75em;
		height: 3.75em;
		outline-width: 0.1875em;
		outline-style: solid;
		outline-color: rgba(0, 0, 0, 0.6);
		position: relative;
		margin: 0;
		padding: 0;
		img {
			width: 3.75em;
			height: 3.75em;
			cursor: pointer;
			&.locked {
				filter: grayscale(100%) opacity(50%);
			}
		}
		figcaption {
			cursor: pointer;
			position: absolute;
			top: 0;
			right: 0;
			color: #fff;
			background: rgba(0, 0, 0, 0.7);
			font-size: 80%;
			padding: 0 0 0 0.2em;
		}
	}
</style>
