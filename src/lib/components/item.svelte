<script lang="ts">
	import helperUtils from '$lib/utils/helper-utils';
	import { stringify } from 'yaml';
	export let item: object;

	function debugInfo() {
		return stringify(item);
	}

	function rarityClass(){
		return item.rarity ? `rarity-${item.rarity.toLowerCase()}` : '';
	}
</script>

<figure class={rarityClass}>
	<a href={helperUtils.wikiLink(item.name)} target="_blank" >
		<img alt={item.name} class="autotooltip" title={`<h4>${item.name}  - <a class="tooltip-link" target="_blank" href="${helperUtils.wikiLink(item.name)}">Click for wiki</a></h4><pre>${debugInfo()}</pre>`} src={item.icon} />
	</a>
	{#if item.count > 1}<figcaption>{item.count}</figcaption>{/if}
</figure>

<style lang="scss" global>
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
