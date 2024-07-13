<script lang="ts">
	import helperUtils from '$lib/utils/helper-utils';
	import { stringify } from 'yaml';
	export let item: object;
	function debugInfo() {
		return stringify(item);
	}
</script>

<figure class="rarity-{item.rarity.toLowerCase()}">
	<a href={helperUtils.wikiLink(item.name)} target="_blank" >
		<img alt={item.name} class="autotooltip" title={`<h4>${item.name}  - <a class="tooltip-link" target="_blank" href="${helperUtils.wikiLink(item.name)}">Click for wiki</a></h4><pre>${debugInfo()}</pre>`} src={item.icon} />
	</a>
	{#if item.count > 1}<figcaption>{item.count}</figcaption>{/if}
</figure>

<style lang="scss" global>
	figure {
		width: 60px;
		height: 60px;
		outline-width: 3px;
		outline-style: solid;
		position: relative;
		margin: 0;
		padding: 0;
		img {
			width: 60px;
			height: 60px;
			cursor: pointer;
		}
		figcaption {
			position: absolute;
			top: 0;
			right: 0;
			color: #fff;
			background: rgba(0, 0, 0, 0.5);
			font-size: 80%;
			padding: 0 0 0 0.2rem;
		}
	}
</style>
