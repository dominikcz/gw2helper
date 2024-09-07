<script lang="ts">
	import helperUtils from '$lib/utils/helper-utils';
	export let item: object;

	function rarityClass() {
		return item.rarity ? `rarity rarity-${item.rarity.toLowerCase()}` : 'rarity';
	}

</script>

<figure class={rarityClass()} >
	<a href={helperUtils.wikiLink(item.name)} target="_blank">
		<img alt={item.name} src={item.icon} data-autotooltip-renderer="img.item" data-autotooltip-params={JSON.stringify(item)} data-id={item.id}/>
	</a>
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
		}
		figcaption {
			cursor: pointer;
			position: absolute;
			top: 0;
			right: 0;
			color: #fff;
			background: rgba(0, 0, 0, 0.5);
			font-size: 80%;
			padding: 0 0 0 0.2em;
		}
	}
</style>
