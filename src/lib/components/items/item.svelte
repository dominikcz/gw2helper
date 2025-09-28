<script lang="ts">
	import { base } from '$app/paths';
	import helperUtils from '$lib/utils/helper-utils';
	interface Props {
		item: object;
	}

	let { item }: Props = $props();

	function rarityClass() {
		return item.rarity ? `rarity rarity-${item.rarity.toLowerCase()}` : 'rarity';
	}
</script>

<figure class={rarityClass()} data-autotooltip-renderer="img.item" data-autotooltip-id={item.id}>
	{#if item.name}
		<a href={helperUtils.wikiLink(item.name)} target="_blank">
			<img alt={item.name} src={item.icon} class:locked={item.locked} />
		</a>
	{:else}
		<a href={helperUtils.apiItemLink(item.id)} target="_blank">
			<img alt="invalid id: {item.id}" title="id: {item.id}" src="{base}/assets/Talk_question_mark_option.png" />
		</a>
		<figcaption>id: {item.id}</figcaption>
	{/if}
	{#if item.count > 1}<figcaption>{item.count}</figcaption>{/if}
</figure>

<style lang="scss">
	figure {
		width: 3.75em;
		height: 3.75em;
		outline-width: 0.1875em;
		outline-style: solid;
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
			background: rgba(0, 0, 0, 0.5);
			font-size: 80%;
			padding: 0 0.2em;
		}
	}
</style>
