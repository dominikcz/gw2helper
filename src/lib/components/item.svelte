<script lang="ts">
	import { stringify } from 'yaml'
	export let item: object;
	function debugInfo(){
		return stringify(item);
	}
</script>

<figure class="rarity-{item.rarity.toLowerCase()}">
	<a href={`https://wiki.guildwars2.com/wiki/${item.name}`} target="_blank"><img alt={item.name} title={`${item.name}. Click for wiki\r\n\r\n${debugInfo()}` } src={item.icon} /></a>
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
