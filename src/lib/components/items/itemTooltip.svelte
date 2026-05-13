<script lang="ts">
	import { resolve } from '$app/paths';
	import utils from "$lib/utils";
	import helperUtils from '$lib/utils/helper-utils';
	import { t as _ } from '$lib/services/i18n';
	import ItemLabel from '$lib/components/items/itemLabel.svelte';
	import type { ItemTooltipData } from '$lib/types/items';

	interface Props {
		item: ItemTooltipData;
	}

	let { item }: Props = $props();

	let flags = getFlags();
	let showApiLinks = utils.getQueryStringFlag('show-api-links');

	function getFlags() {
		if (item.flags) {
			return item.flags.join(', ');
		}
		return '';
	}

	function openWiki() {
		window.open(helperUtils.wikiLink(item.name || ''), '_blank', 'noopener,noreferrer');
	}
</script>

<div class="item-descr">
	<div class="head">
		<ItemLabel
			id={item.id}
			name={item.name}
			icon={item.icon}
			rarity={item.rarity}
			count={item.count}
			showCount={true}
			showId={showApiLinks}
			iconSize="3.2rem"
		/>
	</div>

	<div class="details">
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{#if item.description}<p>{@html item.description}</p>{/if}
		{#if item.level}<p>Required level: {item.level}</p>{/if}
		{#if flags}<p class="flags">{flags}</p>{/if}
		<p class="wiki-link">
			<button class="autotooltip-link wiki-btn" type="button" onclick={openWiki}>{$_('common.click_for_wiki')}</button>
		</p>
		{#if typeof item.detailsHref === 'string' && item.detailsHref}
			<p class="details-link">
				<a class="autotooltip-link" href={resolve(item.detailsHref)}>{$_('legendary.details')}</a>
			</p>
		{/if}
	</div>
</div>

<style lang="scss">
	.item-descr {
		width: 100%;
		height: fit-content;
		display: flex;
		flex-flow: column nowrap;
		margin: 0;
		padding: 0;
        background: rgba(0, 0, 0, 0.8);
		color: rgba(255, 255, 255, 0.85);
        padding: 0 0.4em 0.4em 0;
		.head {
			display: flex;
			flex-flow: row nowrap;
            align-items: center;
            justify-content: stretch;
            width: 100%;
            column-gap: 0.6em;
		}
        .details{
            padding: 0.4em;
        }
		.wiki-link {
			margin-top: 0.5em;
		}
		.details-link {
			margin-top: 0.2em;
		}
		.wiki-btn {
			padding: 0;
			border: 0;
			background: transparent;
		}
        .flags{
            font-size: 80%;
        }
	}
</style>
