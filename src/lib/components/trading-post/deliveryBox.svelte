<script>
	import WidgetInfo from '$lib/components/widgets/widgetInfo.svelte';
	import ItemsList from '$lib/components/items/itemsList.svelte';
	import { base } from '$app/paths';
	import Price from '../price.svelte';
	import { t as _ } from '$lib/services/i18n.js';
	import { autotooltip } from '$lib/actions/autotooltip.js';
	import { grungeBorder } from '$lib/actions/grungeBorder';

	export let showTradingPostLink = true;
	export let coins = 0;
	export let items = [];
</script>

{#if coins || items.length}
	<details open class="bltc" use:grungeBorder>
		<summary>{$_('home.delivery_box')}</summary>
		<div class="delivery-box autotooltip" use:autotooltip>
			{#if coins}
				<WidgetInfo title={$_('home.coins_for_pickup')} value={coins} let:value id="bltc-coins">
					<Price {value} />
				</WidgetInfo>
			{/if}
			{#if items.length}
				<ItemsList summary={$_('home.items_for_pickup')} {items} useBorder={false}/>
			{/if}
			{#if showTradingPostLink}
			<a href="{base}/trading-post/">{$_('home.trading-post')}</a>
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
			background: url(/gw2helper/assets/Trading_Post.png) no-repeat center right 0.6em;
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
