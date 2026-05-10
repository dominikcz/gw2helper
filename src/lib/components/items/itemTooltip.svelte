<script lang="ts">
	import utils from "$lib/utils";
	import helperUtils from '$lib/utils/helper-utils';
	import { t as _ } from '$lib/services/i18n';
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

	function rarityClass() {
		return item.rarity ? `rarity-${item.rarity.toLowerCase()}` : '';
	}

	function openWiki() {
		window.open(helperUtils.wikiLink(item.name || ''), '_blank', 'noopener,noreferrer');
	}
</script>

<div class="item-descr">
	<div class="head">
		<img alt={item.name} src={item.icon} />
				<div class="caption {rarityClass()}">{(item.count ?? 0) > 1 ? item.count : ''} {item.name} {#if showApiLinks}(id: {item.id}){/if}</div>
	</div>

	<div class="details">
		<!-- eslint-disable-next-line svelte/no-at-html-tags -->
		{#if item.description}<p>{@html item.description}</p>{/if}
		{#if item.level}<p>Required level: {item.level}</p>{/if}
		{#if flags}<p class="flags">{flags}</p>{/if}
		<p class="wiki-link">
			<button class="autotooltip-link wiki-btn" type="button" onclick={openWiki}>{$_('common.click_for_wiki')}</button>
		</p>
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
            height: 3.75em;
            align-items: center;
            justify-content: stretch;
            width: 100%;
            column-gap: 0.6em;
			img {
				border-width: 0.15em;
				border-style: solid;
				width: 3.75em;
				cursor: pointer;
			}
			.caption {
				font-size: 110%;
				padding: 0 0 0 0.2em;
			}
		}
        .details{
            padding: 0.4em;
        }
		.wiki-link {
			margin-top: 0.5em;
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
