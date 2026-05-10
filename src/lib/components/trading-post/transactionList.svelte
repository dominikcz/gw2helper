<script lang="ts">
	import wxdates from '$lib/wxjs_dates';
	import Item from '$lib/components/items/item.svelte';
	import Price from '$lib/components/price.svelte';
	import { autotooltip } from '$lib/actions/autotooltip';
	import { itemTooltipRenderer } from '$lib/components/items/itemTooltipRenderer';
	import { t as _ } from '$lib/services/i18n';
	import type { ApiCommercePriceOfferDto, TransactionCurrentItem } from '$lib/types/gw2-api';

	export let items: TransactionCurrentItem[] = [];
	export let offerType = '';

	function isOutbid(item: TransactionCurrentItem): boolean {
		const offer = item[offerType as keyof TransactionCurrentItem] as ApiCommercePriceOfferDto | undefined;
		if (!offer?.unit_price) {
			return false;
		}

		if (offerType === 'buys') {
			return item.price < offer.unit_price;
		}

		if (offerType === 'sells') {
			return item.price > offer.unit_price;
		}

		return false;
	}

	function outbidLabelKey(): string {
		return offerType === 'sells' ? 'trading-post.undercut' : 'trading-post.outbid';
	}

	const tooltipOptions = {
		customRenderers: {
			'img.item': itemTooltipRenderer,
		},
	};
</script>

<div class="container autotooltip autotooltip-sticky" use:autotooltip={tooltipOptions}>
	<table>
		<caption></caption>
		<thead>
			<tr>
				<th>{$_('trading-post.item')}</th>
				<th>{$_('trading-post.my_offer')}</th>
				<th>{$_('trading-post.age')}</th>
				<th>{$_('trading-post.best_offer')}</th>
				<th>{$_('trading-post.ordered_qty')}</th>
			</tr>
		</thead>
		<tbody>
			{#each items as item, index (`${item.id}-${index}`)}
				{@const offer = item[offerType as keyof TransactionCurrentItem] as ApiCommercePriceOfferDto}
				{@const outbid = isOutbid(item)}
				<tr class:outbid={outbid}>
					<td class="item">
						<Item {item} />
						<span class="item-name">{item.name}</span>
					</td>
					<td>
						<Price value={item.price} />
						{#if outbid}
							<div class="status outbid">{$_(outbidLabelKey())}</div>
						{/if}
					</td>
					<td class="item-time">
						{wxdates.friendlyDurationTillNow(new Date(item.created), false)}
					</td>
					<td class="offer" data-label={$_('trading-post.best_offer')}>
						<Price value={offer.unit_price} />
					</td>
					<td class="offer-qty" data-label={$_('trading-post.ordered_qty')}>
						{offer.quantity}
					</td>
				</tr>
			{:else}
				<tr>
					<td colspan="5">
						<span class="no-results">{$_('common.nothing_found')}</span>
					</td>
				</tr>
			{/each}
		</tbody>
	</table>
</div>

<style lang="scss">
	// .transaction-list {
	// 	display: flex;
	// 	flex-flow: column nowrap;
	// 	row-gap: 0.6em;
	// 	padding: 0.625em;
	// }

	.item {
		display: flex;
		column-gap: 1rem;
		align-items: center;
		justify-content: space-between;
		text-align: left;
		margin-left: 0.1rem;
	}

	.item-name {
		flex-grow: 1;
	}

	.container {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	table {
		border-collapse: collapse;
		width: calc(100% - 1.2rem);
		text-align: right;
	}

	thead {
		border-bottom: 1px solid var(--gw2helper-module-text);

		th {
			padding: 0.6rem 0.6rem 0.3rem 0.6rem;
			text-align: right;
			&:first-of-type {
				text-align: left;
			}
		}
	}

	tbody {
		tr {
			&:nth-child(even) {
				background-color: rgba(0, 0, 0, 0.1);
			}
		}
		tr.outbid {
			box-shadow: inset 0 0 0 1px rgba(255, 120, 120, 0.7);
		}
		td {
			padding: 0 0.6rem;
			margin: 0.6rem 0;
		}
	}

	.status {
		margin-top: 0.2rem;
		font-size: var(--step--2);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.status.outbid {
		color: #ff8d8d;
	}

	@media screen and (max-width: 880px) {
		thead {
			display: none;
		}

		table,
		tbody,
		tbody tr,
		tbody td,
		caption {
			display: flex;
			flex-direction: column;
			word-break: break-all;
		}

		table {
			background-color: transparent;
			border-width: 0;
		}

		tbody {
			border: 2px solid var(--color-tertiary);
			// background-color: rgba(255, 255, 255, 0.2);
		}

		table tr {
			padding-bottom: 1rem;
		}

		table tr td:first-child {
			margin-bottom: calc(-1 * var(--step-0));
			flex-direction: row;
			align-items: center;
		}

		table tr td:not(:first-child) {
			padding-left: calc(6rem);
			padding-top: 0;
		}

		tbody tr td:not(:first-child) {
			&::before {
				font-weight: 600;
				font-size: var(--step--1);
			}
			&.offer {
				&::before {
					content: attr(data-label);
				}
			}
			&.offer-qty {
				&::before {
					content: attr(data-label);
				}
			}
		}
	}
</style>
