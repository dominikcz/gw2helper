<script lang="ts">
	import { SvelteMap } from 'svelte/reactivity';
	import Price from '$lib/components/currencies/price.svelte';
	import ItemLabel from '$lib/components/items/itemLabel.svelte';
	import AcquisitionStrategyOptions from '$lib/components/legendary/acquisitionStrategyOptions.svelte';
	import VendorCost from '$lib/components/legendary/vendorCost.svelte';
	import { t as _ } from '$lib/services/i18n';
	import helperUtils from '$lib/utils/helper-utils';
	import type { IngredientRow, ItemSummary } from '$lib/legendary/calculator-types';
	import {
		rowTpUnit, rowCraftUnit, rowVendorUnit,
		rowHasSource, rowHasMultipleSources,
		effectiveDecision, rowUnit, rowEffectiveCost,
		type PriceMode,
	} from '$lib/legendary/display';

	interface Props {
		rows: IngredientRow[];
		itemsById: Record<number, ItemSummary>;
		priceMode: PriceMode;
		decisionOverrides: SvelteMap<string, 'tp' | 'craft' | 'vendor'>;
		onSetDecision: (id: number, decision: 'tp' | 'craft' | 'vendor') => void;
	}

	let { rows, itemsById, priceMode, decisionOverrides, onSetDecision }: Props = $props();

	function itemInfo(id: number) { return itemsById[id]; }
	function wikiHref(id: number) {
		const name = itemInfo(id)?.name;
		return name ? helperUtils.wikiLink(name) : undefined;
	}
	function decisionKey(id: number) { return `${priceMode}:${id}`; }

	function _rowTpUnit(row: IngredientRow) { return rowTpUnit(row, priceMode); }
	function _rowCraftUnit(row: IngredientRow) { return rowCraftUnit(row, priceMode); }
	function _rowVendorUnit(row: IngredientRow) { return rowVendorUnit(row, priceMode); }
	function _rowHasSource(row: IngredientRow, source: 'tp' | 'craft' | 'vendor') {
		return rowHasSource(row, priceMode, source);
	}
	function _rowHasMultipleSources(row: IngredientRow) { return rowHasMultipleSources(row, priceMode); }
	function _effectiveDecision(row: IngredientRow) {
		return effectiveDecision(row, priceMode, decisionOverrides.get(decisionKey(row.id)));
	}
	function _rowUnit(row: IngredientRow) {
		return rowUnit(row, priceMode, decisionOverrides.get(decisionKey(row.id)));
	}
	function _rowEffectiveCost(row: IngredientRow) {
		return rowEffectiveCost(row, priceMode, decisionOverrides.get(decisionKey(row.id)));
	}

	const totalMissingCost = $derived(
		rows.reduce((sum, row) => {
			if (!row.missing) return sum;
			const lineCost = _rowEffectiveCost(row);
			if (lineCost == null || !Number.isFinite(lineCost) || lineCost < 0) return sum;
			return sum + lineCost;
		}, 0)
	);
</script>

<p class="table-legend">
	<span class="legend-free-sample">+N</span>
	{$_('legendary.legend_free_units')}
</p>
<table>
	<thead>
		<tr>
			<th colspan="2">{$_('legendary.ingredient')}</th>
			<th class="num-col unit-col">{$_('legendary.unit_price')}</th>
			<th class="num-col total-col">{$_('legendary.total_cost')}</th>
		</tr>
	</thead>
	<tbody>
		{#each rows as row (row.id)}
			{@const info = itemInfo(row.id)}
			{@const wiki = wikiHref(row.id)}
			{@const rowCost = _rowEffectiveCost(row)}
			{@const rowFreeUnits = _effectiveDecision(row) !== 'vendor' ? row.vendorFreeUnits : 0}
			{@const rowPaidMissing = row.missing > 0 ? Math.max(0, row.missing - rowFreeUnits) : 0}
			<tr class:done={row.missing === 0}>
				<td class="num-col">
					{#if rowFreeUnits > 0 && row.missing > 0}
						<span class="missing-paid">{rowPaidMissing}</span>
						<span class="missing-free" title="vendor (free)">+{rowFreeUnits}</span>
					{:else}
						{row.missing}
					{/if}
				</td>
				<td class="ingredient-cell">
					<div class="ingredient-main-line">
						<ItemLabel
							class="neutral-label"
							id={row.id}
							name={info?.name || `#${row.id}`}
							icon={info?.icon}
							href={wiki}
							linkTitle={$_('common.click_for_wiki')}
							linkCaption={true}
							iconSize="1.2rem"
						/>
						<span class="mobile-inline-total">
							{#if rowCost != null}
								<Price value={rowCost} />
							{:else}
								-
							{/if}
						</span>
					</div>
					<div class="mobile-pricing" aria-label="Mobile pricing details">
						<div class="mobile-pricing-row">
							<span class="mobile-pricing-label">{$_('legendary.unit_price')}</span>
							<div class="price-options">
								<AcquisitionStrategyOptions
									groupName={`acq-mobile-${priceMode}-${row.id}`}
									selected={_effectiveDecision(row)}
									tpAvailable={_rowHasSource(row, 'tp')}
									craftAvailable={_rowHasSource(row, 'craft')}
									vendorAvailable={_rowHasSource(row, 'vendor')}
									tpUnit={_rowTpUnit(row)}
									craftUnit={_rowCraftUnit(row)}
									vendorUnit={_rowVendorUnit(row)}
									hasMultipleSources={_rowHasMultipleSources(row)}
									onSelect={(source) => onSetDecision(row.id, source)}
								/>
							</div>
						</div>
					</div>
				</td>
				<td class="num-col unit-col">
					<div class="price-options">
						<AcquisitionStrategyOptions
							groupName={`acq-table-${priceMode}-${row.id}`}
							selected={_effectiveDecision(row)}
							tpAvailable={_rowHasSource(row, 'tp')}
							craftAvailable={_rowHasSource(row, 'craft')}
							vendorAvailable={_rowHasSource(row, 'vendor')}
							tpUnit={_rowTpUnit(row)}
							craftUnit={_rowCraftUnit(row)}
							vendorUnit={_rowVendorUnit(row)}
							hasMultipleSources={_rowHasMultipleSources(row)}
							onSelect={(source) => onSetDecision(row.id, source)}
						/>
						{#if !_rowHasSource(row, 'tp') && !_rowHasSource(row, 'craft') && !_rowHasSource(row, 'vendor') && row.acquisition?.vendors?.length}
							<VendorCost acquisition={row.acquisition} {itemsById} />
						{/if}
					</div>
				</td>
				<td class="num-col total-col">
					{#if rowCost != null}
						<Price value={rowCost} />
					{:else}
						-
					{/if}
				</td>
			</tr>
		{/each}
	</tbody>
	<tfoot>
		<tr class="summary-row">
			<td colspan="3"></td>
			<td class="num-col"><Price value={totalMissingCost} /></td>
		</tr>
	</tfoot>
</table>

<style lang="scss">
	.table-legend {
		margin: 0.4rem 0 0;
		font-size: 0.8em;
		opacity: 0.7;
		display: flex;
		align-items: center;
		gap: 0.35em;
	}

	.legend-free-sample {
		font-size: 0.78em;
		color: var(--color-success, #7fc97f);
		font-weight: 600;
	}

	table {
		width: auto;
		max-width: 100%;
		border-collapse: collapse;
	}

	th,
	td {
		padding: 0.35rem;
		text-align: left;
	}

	th.num-col,
	td.num-col {
		text-align: right;
		white-space: nowrap;
	}

	thead tr {
		border-bottom: 1px solid rgba(255, 255, 255, 0.2);
	}

	tbody tr {
		border-bottom: 1px dashed rgba(255, 255, 255, 0.15);
	}

	tbody td {
		vertical-align: top;
	}

	tbody td.total-col {
		vertical-align: middle;
	}

	tfoot .summary-row {
		border-top: 1px solid rgba(255, 255, 255, 0.2);
	}

	tfoot .summary-row td {
		font-weight: 600;
	}

	tr.done {
		opacity: 0.65;
	}

	.missing-paid {
		display: block;
	}

	.missing-free {
		display: block;
		font-size: 0.78em;
		opacity: 0.65;
		color: var(--color-success, #7fc97f);
	}

	.ingredient-cell {
		padding-right: 3em;
	}

	.ingredient-cell :global(.item-label) {
		display: inline-flex;
		align-items: center;
		max-width: 100%;
	}

	.ingredient-cell :global(.caption) {
		max-width: min(28rem, 55vw);
	}

	.ingredient-cell :global(.caption-link) {
		color: var(--gw2helper-link-color);
	}

	.ingredient-cell :global(.caption-link .caption) {
		color: var(--gw2helper-link-color);
	}

	.ingredient-cell :global(.caption-link:visited) {
		color: var(--gw2helper-link-visited);
	}

	.ingredient-cell :global(.caption-link:visited .caption) {
		color: var(--gw2helper-link-visited);
	}

	.ingredient-cell :global(.caption-link:hover),
	.ingredient-cell :global(.caption-link:focus-visible) {
		color: var(--gw2helper-link-hover);
	}

	.ingredient-cell :global(.caption-link:hover .caption),
	.ingredient-cell :global(.caption-link:focus-visible .caption) {
		color: var(--gw2helper-link-hover);
	}

	.ingredient-main-line {
		display: block;
	}

	.mobile-inline-total {
		display: none;
	}

	.mobile-pricing {
		display: none;
		margin-top: 0.45rem;
		padding-top: 0.35rem;
		border-top: 1px dashed rgba(255, 255, 255, 0.16);
	}

	.mobile-pricing-row {
		display: grid;
		grid-template-columns: minmax(6.5rem, auto) minmax(0, 1fr);
		align-items: start;
		column-gap: 0.6rem;
		margin-top: 0.25rem;
	}

	.mobile-pricing-label {
		font-size: 0.8rem;
		opacity: 0.8;
		padding-top: 0.2rem;
	}

	.mobile-pricing .price-options {
		display: flex;
		min-width: 0;
		width: 100%;
	}

	.mobile-pricing :global(.strategy-line) {
		grid-template-columns: auto 3.2rem minmax(0, 1fr);
	}

	.mobile-pricing :global(.strategy-price) {
		overflow-wrap: anywhere;
	}

	.price-options :global(.strategy-line) {
		display: grid;
		grid-template-columns: auto 3.7rem minmax(7.5rem, 1fr);
		align-items: center;
		column-gap: 0.3rem;
		width: 100%;
	}

	.price-options :global(.strategy-line input[type='radio']) {
		margin: 0;
	}

	.price-options :global(.strategy-name) {
		font-weight: 700;
		text-align: left;
	}

	.price-options :global(.strategy-price) {
		justify-self: end;
		text-align: right;
		white-space: nowrap;
	}

	.price-options {
		display: inline-flex;
		flex-direction: column;
		gap: 0.2rem;
		align-items: stretch;
		min-width: 14rem;
	}

	@media (max-width: 760px) {
		table {
			width: 100%;
			font-size: 0.85rem;
		}

		.unit-col,
		.total-col {
			display: none;
		}

		.mobile-pricing {
			display: block;
		}

		.ingredient-main-line {
			display: flex;
			align-items: center;
			justify-content: space-between;
			gap: 0.5rem;
			min-width: 0;
		}

		.ingredient-main-line :global(.item-label) {
			min-width: 0;
			flex: 1 1 auto;
		}

		.mobile-inline-total {
			display: inline-flex;
			justify-content: flex-end;
			white-space: nowrap;
			font-weight: 600;
		}

		.ingredient-cell {
			padding-right: 0.35rem;
		}

		.ingredient-cell :global(.caption) {
			max-width: 100%;
		}

		tfoot .summary-row td {
			padding-top: 0.6rem;
		}

		tfoot .summary-row td:first-child,
		tfoot .summary-row td:nth-child(2),
		tfoot .summary-row td:nth-child(3) {
			display: none;
		}

		tfoot .summary-row td:last-child {
			display: table-cell;
			text-align: right;
		}
	}
</style>
