<script lang="ts">
	import WidgetInfo from '$lib/components/widgets/widgetInfo.svelte';
	import ItemsList from '$lib/components/items/itemsList.svelte';
	import { resolve } from '$app/paths';
	import Price from '../price.svelte';
	import { t as _ } from '$lib/services/i18n';
	import { autotooltip } from '$lib/actions/autotooltip';
	import { grungeBorder } from '$lib/actions/grungeBorder';
import type { ExpandedItem } from '$lib/types/gw2-api';

	interface Props {
		showTradingPostLink?: boolean;
		coins?: number;
		items?: ExpandedItem[];
	}

	let { showTradingPostLink = true, coins = 0, items = [] }: Props = $props();
</script>

{#if coins || items.length}
	<details open class="bltc" use:grungeBorder>
		<summary>{$_('home.delivery_box')}</summary>
		<div class="delivery-box autotooltip" use:autotooltip>
			{#if coins}
				<WidgetInfo title={$_('home.coins_for_pickup')} value={`${coins}`}  id="bltc-coins">
					{#snippet children({ value })}
						<Price value={Number(value)} />
					{/snippet}
				</WidgetInfo>
			{/if}
			{#if items.length}
				<ItemsList summary={$_('home.items_for_pickup')} {items} useBorder={false}/>
			{/if}
			{#if showTradingPostLink}
			<a href={resolve('/trading-post/')}>{$_('home.trading-post')}</a>
			{/if}
		</div>
	</details>
{/if}

<style lang="scss">
	.delivery-box {
		margin: 0 0.6em;
		display: flex;
		flex-flow: column nowrap;
		gap: 0.625em;
		align-items: normal;
	}

	.bltc {
		summary {
			background: var(--asset-trading-post) no-repeat center right 0.6em;
			background-size: 3em;
		}
	}

	:global(#bltc-coins .value) {
		font-size: 1.4em;
	}
	// @media (prefers-color-scheme: dark) {
	// 	.currency {

	// 	}
	// }
</style>
