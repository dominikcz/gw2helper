/**
 * Pure display/presentation logic for legendary ingredient rows.
 * No Svelte dependencies — safe to import in unit tests.
 */

import type { IngredientRow, RecipeTreeNode } from './calculator-types';

export type PriceMode = 'buy' | 'sell';
export type AcquisitionSource = 'tp' | 'craft' | 'vendor' | 'none';

export type TreeMetric = { missing: number; cost: number | null };

// ─── Unit price accessors ──────────────────────────────────────────────────────

export function rowTpUnit(row: IngredientRow, priceMode: PriceMode): number | null {
	return priceMode === 'buy' ? row.buyUnit : row.sellUnit;
}

export function rowCraftUnit(row: IngredientRow, priceMode: PriceMode): number | null {
	return priceMode === 'buy' ? row.craftBuyUnit : row.craftSellUnit;
}

export function rowVendorUnit(row: IngredientRow, priceMode: PriceMode): number | null {
	return priceMode === 'buy' ? row.vendorBuyUnit : row.vendorSellUnit;
}

export function rowHasSource(row: IngredientRow, priceMode: PriceMode, source: 'tp' | 'craft' | 'vendor'): boolean {
	const unit =
		source === 'tp' ? rowTpUnit(row, priceMode) :
		source === 'craft' ? rowCraftUnit(row, priceMode) :
		rowVendorUnit(row, priceMode);
	return unit != null && Number.isFinite(unit) && unit >= 0;
}

export function rowHasMultipleSources(row: IngredientRow, priceMode: PriceMode): boolean {
	return (
		[rowHasSource(row, priceMode, 'tp'), rowHasSource(row, priceMode, 'craft'), rowHasSource(row, priceMode, 'vendor')]
			.filter(Boolean).length > 1
	);
}

// ─── Strategy decision ────────────────────────────────────────────────────────

/**
 * Returns the effective acquisition strategy for a row.
 * @param override  User-selected override for this row+priceMode, if any.
 */
export function effectiveDecision(
	row: IngredientRow,
	priceMode: PriceMode,
	override?: 'tp' | 'craft' | 'vendor'
): AcquisitionSource {
	if (override && rowHasSource(row, priceMode, override)) return override;

	const auto = priceMode === 'buy' ? row.bestBuySource : row.bestSellSource;
	if ((auto === 'tp' || auto === 'craft' || auto === 'vendor') && rowHasSource(row, priceMode, auto)) return auto;

	if (rowHasSource(row, priceMode, 'tp')) return 'tp';
	if (rowHasSource(row, priceMode, 'craft')) return 'craft';
	if (rowHasSource(row, priceMode, 'vendor')) return 'vendor';
	return 'none';
}

/** Current unit price for the row based on effective decision. */
export function rowUnit(
	row: IngredientRow,
	priceMode: PriceMode,
	override?: 'tp' | 'craft' | 'vendor'
): number | null {
	const decision = effectiveDecision(row, priceMode, override);
	if (decision === 'tp') return rowTpUnit(row, priceMode);
	if (decision === 'craft') return rowCraftUnit(row, priceMode);
	if (decision === 'vendor') return rowVendorUnit(row, priceMode);
	return null;
}

/**
 * Effective total cost for a row, accounting for vendor free units.
 * When TP/craft is chosen but vendor can cover some units for free,
 * a mixed strategy reduces the total cost.
 */
export function rowEffectiveCost(
	row: IngredientRow,
	priceMode: PriceMode,
	override?: 'tp' | 'craft' | 'vendor'
): number | null {
	if (row.missing <= 0) return 0;
	const unit = rowUnit(row, priceMode, override);
	if (unit == null) return null;
	const decision = effectiveDecision(row, priceMode, override);
	if (decision !== 'vendor' && row.vendorFreeUnits > 0) {
		const paidUnits = Math.max(0, row.missing - row.vendorFreeUnits);
		return paidUnits * unit;
	}
	return unit * row.missing;
}

// ─── Tree metrics ─────────────────────────────────────────────────────────────

/**
 * Compute missing counts and costs for every node in the recipe tree.
 * Returns a map keyed by path string (e.g. "root.12345-0.67890-1").
 */
export function computeTreeMetrics(
	root: RecipeTreeNode,
	rowById: Map<number, IngredientRow>,
	ownedById: Record<number, number>,
	priceMode: PriceMode,
	decisionOverrides?: Map<string, 'tp' | 'craft' | 'vendor'>
): Map<string, TreeMetric> {
	const out = new Map<string, TreeMetric>();
	const ownedPool = new Map<number, number>();
	for (const [id, count] of Object.entries(ownedById)) {
		const numId = Number(id);
		const numCount = Number(count || 0);
		if (!Number.isFinite(numId) || numId <= 0 || !Number.isFinite(numCount) || numCount <= 0) continue;
		ownedPool.set(numId, numCount);
	}

	const visit = (node: RecipeTreeNode, path: string): TreeMetric => {
		if (node.cycle) {
			const metric = { missing: node.count, cost: null };
			out.set(path, metric);
			return metric;
		}

		const available = ownedPool.get(node.id) || 0;
		const consumed = Math.min(available, node.count);
		if (consumed > 0) ownedPool.set(node.id, available - consumed);

		const missing = Math.max(0, node.count - consumed);
		if (missing <= 0) {
			const metric = { missing: 0, cost: 0 };
			out.set(path, metric);
			return metric;
		}

		const row = rowById.get(node.id);
		const overrideKey = `${priceMode}:${node.id}`;
		const override = decisionOverrides?.get(overrideKey);
		const unit = row ? rowUnit(row, priceMode, override) : null;

		let directCost: number | null = null;
		if (unit != null && row) {
			const dec = effectiveDecision(row, priceMode, override);
			if (dec !== 'vendor' && row.vendorFreeUnits > 0) {
				const paidUnits = Math.max(0, missing - Math.min(missing, row.vendorFreeUnits));
				directCost = paidUnits * unit;
			} else {
				directCost = unit * missing;
			}
		}

		if (row) {
			const metric = { missing, cost: directCost };
			out.set(path, metric);
			return metric;
		}

		if (!node.children.length) {
			const metric = { missing, cost: directCost };
			out.set(path, metric);
			return metric;
		}

		let childrenTotal = 0;
		let hasChildrenCost = false;
		node.children.forEach((child, idx) => {
			const childMetric = visit(child, `${path}.${child.id}-${idx}`);
			if (childMetric.cost == null) return;
			hasChildrenCost = true;
			childrenTotal += childMetric.cost;
		});

		const metric = { missing, cost: hasChildrenCost ? childrenTotal : directCost };
		out.set(path, metric);
		return metric;
	};

	visit(root, 'root');
	return out;
}
