<script lang="ts">
	import helperUtils from '$lib/utils/helper-utils';
	interface Props {
		item: {
			id: number;
			name: string;
			icon: string;
			count: number;
			max_count: number;
		};
	}

	let { item }: Props = $props();

	function openWiki() {
		window.open(helperUtils.wikiLink(item.name), '_blank', 'noopener,noreferrer');
	}
</script>

<figure
	data-autotooltip-renderer="img.item"
	data-autotooltip-id={item.id}
	data-autotooltip-params={JSON.stringify({ detailsHref: `/legendary/${item.id}/` })}
>
	<button type="button" onclick={openWiki}>
		<img alt={item.name} src={item.icon} class:locked={!item.count} />
	</button>
	{#if item.count && item.max_count > 1}<figcaption>{item.count}/{item.max_count}</figcaption>{/if}
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
		button {
			border: 0;
			padding: 0;
			background: transparent;
			display: block;
		}
	}
</style>
