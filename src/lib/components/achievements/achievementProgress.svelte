<script>
	import { resolve } from '$app/paths';
	import { MINIS_CACHE } from '$lib/consts';
	import helperUtils from '$lib/utils/helper-utils';

	/** @type {{ type: string, bits: any, bitsDone: any, itemsCache: CallableFunction, minisCache: CallableFunction, skinsCache: CallableFunction}} */
	let { type, bits = [], bitsDone = [], itemsCache = (id) => ({}), minisCache = (id) => ({}), skinsCache = (id) => ({}) } = $props();
</script>

{#snippet progressText(bits, bitsDone)}
	<ol>
		{#each bits as item, idx}
			<li class:done={bitsDone.includes(idx)}>{item.text}</li>
		{/each}
	</ol>
{/snippet}

{#snippet progressItemSet(bits, bitsDone)}
	<div class="items condensed autotooltip autotooltip-sticky">
		{#each bits as x, idx}
			{@const item = x.type == 'Item' ? itemsCache(x.id) : x.type == 'Minipet' ? minisCache(x.id) : x.type == 'Skin' ? skinsCache(x.id) : {}}
			{#if item}
				<a href={helperUtils.wikiLink(item.name)} target="_blank">
					<img alt={item.name} src={item.icon} class:done={bitsDone.includes(idx)} />
				</a>
			{:else}
				<img src={resolve('/assets/Talk_question_mark_option.png')} alt="item id {x.id} not found" />
			{/if}
		{/each}
	</div>
{/snippet}

{#if type == 'Default'}
	{@render progressText(bits, bitsDone)}
{:else if type == 'ItemSet'}
	{@render progressItemSet(bits, bitsDone)}
{/if}

<style lang="scss">
	img {
		filter: grayscale(100%) opacity(50%);

		&.done {
			filter: none;
		}
	}

	li {
		font-size: 80%;
		&.done {
			text-decoration: line-through;
			color: var(--gw2helper-not-important);
		}
	}
</style>
