<script lang="ts">
	import { asset } from '$app/paths';
	import helperUtils from '$lib/utils/helper-utils';
	import type { AchievementBit, CachedEntity } from '$lib/types/achievements';
	interface Props {
		type: string;
		bits?: AchievementBit[];
		bitsDone?: number[];
		done?: boolean;
		itemsCache?: (id: number) => CachedEntity;
		minisCache?: (id: number) => CachedEntity;
		skinsCache?: (id: number) => CachedEntity;
	}
	let {
		type,
		bits = [],
		bitsDone = [],
		done = false,
		itemsCache = (_id: number) => ({}),
		minisCache = (_id: number) => ({}),
		skinsCache = (_id: number) => ({})
	}: Props = $props();

	function isBitDoneByIndexOrId(idx: number, bit: AchievementBit) {
		// API payloads for bits_done may be index-based or id-based depending on achievement type/source.
		return bitsDone.includes(idx) || (bit?.id != null && bitsDone.includes(bit.id));
	}

	function resolveBitEntity(bit: AchievementBit): CachedEntity | null {
		if (bit?.id == null) return null;
		if (bit?.type === 'Item') return itemsCache(bit.id);
		if (bit?.type === 'Minipet') return minisCache(bit.id);
		if (bit?.type === 'Skin') return skinsCache(bit.id);
		return null;
	}
</script>

{#snippet progressText(bits: AchievementBit[], bitsDone: number[])}
	<ol>
		{#each bits as item, idx}
			<li class:done={isBitDoneByIndexOrId(idx, item)}>{item.text}</li>
		{/each}
	</ol>
{/snippet}

{#snippet progressItemSet(bits: AchievementBit[], bitsDone: number[])}
	<div class="items condensed autotooltip autotooltip-sticky">
		{#each bits as x, idx}
			{@const item = resolveBitEntity(x)}
			{#if item?.icon}
				<a href={helperUtils.wikiLink(item.name || '')} target="_blank">
					<img alt={item.name} src={item.icon} class:done={isBitDoneByIndexOrId(idx, x)} />
				</a>
			{:else}
				<img src={asset('/assets/Talk_question_mark_option.png')} alt="item id {x.id} not found" />
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
		max-width: 64px;
		max-height: 64px;
		width: 64px;
		height: 64px;
		object-fit: contain;

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
