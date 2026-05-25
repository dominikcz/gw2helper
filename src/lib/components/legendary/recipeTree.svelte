<script lang="ts">
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import Price from '$lib/components/currencies/price.svelte';
	import ItemLabel from '$lib/components/items/itemLabel.svelte';
	import Progress from '$lib/components/progress/progress.svelte';
	import AcquisitionStrategyOptions from '$lib/components/legendary/acquisitionStrategyOptions.svelte';
	import { t as _ } from '$lib/services/i18n';
	import helperUtils from '$lib/utils/helper-utils';
	import type { RecipeTreeNode, IngredientRow, ItemSummary } from '$lib/legendary/calculator-types';
	import {
		rowTpUnit, rowCraftUnit, rowVendorUnit,
		rowHasSource, rowHasMultipleSources,
		effectiveDecision,
		computeTreeMetrics,
		type PriceMode,
	} from '$lib/legendary/display';

	interface Props {
		recipeTree: RecipeTreeNode;
		rows: IngredientRow[];
		itemsById: Record<number, ItemSummary>;
		ownedById: Record<number, number>;
		priceMode: PriceMode;
		decisionOverrides: SvelteMap<string, 'tp' | 'craft' | 'vendor'>;
		onSetDecision: (id: number, decision: 'tp' | 'craft' | 'vendor') => void;
	}

	let { recipeTree, rows, itemsById, ownedById, priceMode, decisionOverrides, onSetDecision }: Props = $props();

	const expandedNodes = new SvelteSet<string>(['root']);

	const rowById = $derived(new SvelteMap(rows.map((row) => [row.id, row] as const)));
	const treeMetricsByPath = $derived.by(() => {
		const metrics = computeTreeMetrics(recipeTree, rowById, ownedById, priceMode, decisionOverrides);
		return new SvelteMap(metrics);
	});

	function itemInfo(id: number) { return itemsById[id]; }
	function wikiHref(id: number) {
		const name = itemInfo(id)?.name;
		return name ? helperUtils.wikiLink(name) : undefined;
	}
	function decisionKey(id: number) { return `${priceMode}:${id}`; }
	function ownedCount(id: number) { return ownedById[id] || 0; }

	function decodeHtmlEntities(str: string | null | undefined): string {
		if (!str) return str ?? '';
		return str
			.replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
			.replace(/&amp;/g, '&')
			.replace(/&lt;/g, '<')
			.replace(/&gt;/g, '>')
			.replace(/&quot;/g, '"')
			.replace(/&#39;/g, "'");
	}

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

	function nodeMissing(id: number, required: number) { return Math.max(0, required - ownedCount(id)); }
	function nodeMissingAtPath(node: RecipeTreeNode, path: string) {
		const metric = treeMetricsByPath.get(path);
		if (metric) return metric.missing;
		return nodeMissing(node.id, node.count);
	}
	function nodeProgressMax(required: number) { return Math.max(1, required); }
	function nodeProgressValueAtPath(node: RecipeTreeNode, path: string) {
		const missing = nodeMissingAtPath(node, path);
		return Math.min(nodeProgressMax(node.count), Math.max(0, node.count - missing));
	}
	function nodeProgressLabelAtPath(node: RecipeTreeNode, path: string) {
		const missing = nodeMissingAtPath(node, path);
		return `${Math.max(0, node.count - missing)}/${node.count}`;
	}

	function canExpandNode(node: RecipeTreeNode, path: string) {
		if (!node.children.length || nodeMissingAtPath(node, path) <= 0) return false;
		if (rowById.has(node.id) && !node.children.some(c => c.id === 0)) {
			const row = rowById.get(node.id)!;
			if (_rowHasSource(row, 'craft')) return true;
			const anyChildExpandable = node.children.some(c => {
				if (c.children.length > 0) return true;
				const childRow = rowById.get(c.id);
				return childRow ? _rowHasSource(childRow, 'craft') : false;
			});
			if (!anyChildExpandable) return false;
		}
		return true;
	}

	function isInteractiveTarget(target: EventTarget | null) {
		if (!(target instanceof Element)) return false;
		return Boolean(target.closest('a, button, input, select, textarea, label'));
	}
	function onNodeRowClick(event: MouseEvent, node: RecipeTreeNode, path: string) {
		if (!canExpandNode(node, path)) return;
		if (isInteractiveTarget(event.target)) return;
		toggleNode(path);
	}
	function onNodeRowKeydown(event: KeyboardEvent, node: RecipeTreeNode, path: string) {
		if (!canExpandNode(node, path)) return;
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		toggleNode(path);
	}
	function isExpanded(path: string) { return expandedNodes.has(path); }
	function toggleNode(path: string) {
		if (expandedNodes.has(path)) expandedNodes.delete(path);
		else expandedNodes.add(path);
	}
	function collectPaths(node: RecipeTreeNode, path: string, out: Set<string>) {
		out.add(path);
		if (!canExpandNode(node, path)) return;
		node.children.forEach((child, idx) => collectPaths(child, `${path}.${child.id}-${idx}`, out));
	}
	function expandAll() {
		const next = new Set<string>();
		collectPaths(recipeTree, 'root', next);
		expandedNodes.clear();
		next.forEach((path) => expandedNodes.add(path));
	}
	function collapseAll() {
		expandedNodes.clear();
		expandedNodes.add('root');
	}
</script>

<div class="tree-controls">
	<button type="button" onclick={expandAll}>{$_('legendary.expand_all')}</button>
	<button type="button" onclick={collapseAll}>{$_('legendary.collapse_all')}</button>
</div>

{#snippet recipeNode(node: RecipeTreeNode, path: string)}
{@const pathMetric = treeMetricsByPath.get(path)}
{@const missingCost = pathMetric?.cost ?? null}
{@const missingCount = pathMetric?.missing ?? nodeMissing(node.id, node.count)}
<li>
	<div
		class="node-row"
		class:owned={missingCount <= 0}
		class:not-owned={missingCount > 0}
		onclick={(event) => onNodeRowClick(event, node, path)}
		onkeydown={(event) => onNodeRowKeydown(event, node, path)}
		role="button"
		tabindex="0"
		aria-expanded={canExpandNode(node, path) ? isExpanded(path) : undefined}
	>
		{#if canExpandNode(node, path)}
			<span class="tree-toggle" class:expanded={isExpanded(path)} aria-hidden="true">►</span>
		{:else}
			<span class="tree-leaf" aria-hidden="true"></span>
		{/if}
		<ItemLabel
			class="neutral-label"
			id={node.id > 0 ? node.id : undefined}
			name={node.id > 0 ? itemInfo(node.id)?.name : decodeHtmlEntities(node.name ?? '')}
			icon={node.id > 0 ? itemInfo(node.id)?.icon : node.icon_url}
			iconSize="40px"
			count={node.count}
			showCount={true}
			countOnIcon={true}
			href={node.id > 0 ? wikiHref(node.id) : undefined}
			linkTitle={node.id > 0 ? $_('common.click_for_wiki') : undefined}
		/>
		{#if node.id > 0}
			{#if missingCount > 1}
				<span class="node-missing-inline">{$_('legendary.missing_inline', { count: missingCount })}</span>
			{/if}
			<span
				class="node-progress"
				title={$_('legendary.progress_owned_required', {
					owned: nodeProgressValueAtPath(node, path),
					required: node.count,
				})}
			>
				{#if missingCost != null && missingCost >= 0 && missingCount > 0}
					<span class="node-cost"><Price value={missingCost} /></span>
					{@const nodeRow = rowById.get(node.id)}
					{#if nodeRow && missingCount > 0}
						<span class="node-strategy" title="Optimal acquisition">
							<AcquisitionStrategyOptions
								groupName={`acq-tree-${priceMode}-${nodeRow.id}-${path}`}
								selected={_effectiveDecision(nodeRow)}
								tpAvailable={_rowHasSource(nodeRow, 'tp')}
								craftAvailable={_rowHasSource(nodeRow, 'craft')}
								vendorAvailable={_rowHasSource(nodeRow, 'vendor')}
								tpUnit={_rowTpUnit(nodeRow)}
								craftUnit={_rowCraftUnit(nodeRow)}
								vendorUnit={_rowVendorUnit(nodeRow)}
								hasMultipleSources={_rowHasMultipleSources(nodeRow)}
								onSelect={(source) => onSetDecision(nodeRow.id, source)}
							/>
						</span>
					{/if}
				{:else if node.gold_cost && missingCount > 0}
					<span class="node-cost"><Price value={node.gold_cost * missingCount} /></span>
				{/if}
				<Progress
					max={nodeProgressMax(node.count)}
					value={nodeProgressValueAtPath(node, path)}
					label={nodeProgressLabelAtPath(node, path)}
				/>
			</span>
		{/if}
		{#if node.cycle}
			<span class="chip warning">{$_('legendary.cycle')}</span>
		{/if}
	</div>
	{#if canExpandNode(node, path) && isExpanded(path)}
		<ul>
			{#each node.children as child, idx (`${path}.${child.id}-${idx}`)}
				{@render recipeNode(child, `${path}.${child.id}-${idx}`)}
			{/each}
		</ul>
	{/if}
</li>
{/snippet}

<ul class="tree-root">
	{#each (recipeTree.children || []) as child, idx (`root.${child.id}-${idx}`)}
		{@render recipeNode(child, `root.${child.id}-${idx}`)}
	{/each}
</ul>

<style lang="scss">
	.tree-controls {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 0.6rem;
	}

	.tree-root,
	.tree-root ul {
		list-style: none;
		margin: 0;
		padding-left: 1.1rem;
		padding-right: 0;
	}

	.tree-root {
		padding-right: 1.1rem;
	}

	.tree-root li {
		margin: 0.45rem 0;
	}

	.node-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex-wrap: wrap;
		width: 100%;
		box-sizing: border-box;
		padding: 0.6em 0.6em 0.6em 0.3em;
		border-radius: 0.35rem;
	}

	.node-row.owned {
		background: var(--gw2helper-info);
	}

	.node-row.not-owned {
		background: var(--gw2helper-module);
	}

	.tree-toggle,
	.tree-leaf {
		width: 1.1rem;
		height: 1.1rem;
		display: inline-flex;
		justify-content: center;
		align-items: center;
		flex: 0 0 1.1rem;
	}

	.tree-toggle {
		transition: transform 0.2s;
		transform-origin: center;
		color: inherit;
		cursor: pointer;
		user-select: none;
	}

	.tree-toggle.expanded {
		transform: rotate(90deg);
	}

	.currency-leaf {
		display: inline-flex;
		align-items: center;
		gap: 0.35rem;
	}

	.currency-leaf-icon {
		width: 1.6rem;
		height: 1.6rem;
		object-fit: contain;
	}

	.currency-leaf-label {
		font-size: 0.95rem;
	}

	.unresolved-ingredient {
		font-style: italic;
		opacity: 0.85;
	}

	.currency-icon {
		width: 1.2rem;
		height: 1.2rem;
		object-fit: contain;
		vertical-align: middle;
	}

	.node-progress {
		display: inline-flex;
		align-items: center;
		gap: 0.45rem;
		margin-left: auto;
		flex: 0 0 auto;
	}

	.node-cost {
		display: inline-flex;
		align-items: center;
		min-width: 4.5rem;
		justify-content: flex-end;
	}

	.node-strategy {
		display: inline-flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.2rem;
		font-size: 0.82em;
		opacity: 0.95;
	}

	.node-strategy :global(.strategy-line) {
		display: grid;
		grid-template-columns: auto 3.7rem minmax(7.5rem, 1fr);
		align-items: center;
		column-gap: 0.3rem;
		width: 100%;
	}

	.node-strategy :global(.strategy-line input[type='radio']) {
		margin: 0;
	}

	.node-strategy :global(.strategy-name) {
		font-weight: 700;
		text-align: left;
	}

	.node-strategy :global(.strategy-price) {
		justify-self: end;
		text-align: right;
		white-space: nowrap;
	}

	.node-missing-inline {
		opacity: 0.85;
		font-size: 0.9em;
	}

	.warning {
		color: #fba6a6;
	}

	@media (max-width: 760px) {
		.tree-root,
		.tree-root ul {
			padding-left: 0.75rem;
		}

		.tree-root {
			padding-right: 0.25rem;
		}

		.node-row {
			display: grid;
			grid-template-columns: 1.1rem minmax(0, 1fr);
			align-items: start;
			column-gap: 0.45rem;
			row-gap: 0.35rem;
			padding-right: 0.45rem;
		}

		.node-row :global(.item-label) {
			min-width: 0;
		}

		.node-missing-inline {
			grid-column: 2;
		}

		.node-progress {
			grid-column: 2;
			margin-left: 0;
			width: 100%;
			display: inline-flex;
			flex-direction: column;
			align-items: flex-start;
			justify-content: flex-start;
			gap: 0.3rem;
		}

		.node-cost {
			min-width: 0;
			justify-content: flex-start;
		}

		.node-strategy {
			width: 100%;
			font-size: 0.78em;
		}

		.node-strategy :global(.strategy-line) {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			column-gap: 0.35rem;
			row-gap: 0.15rem;
		}

		.node-strategy :global(.strategy-price) {
			margin-left: auto;
			overflow-wrap: anywhere;
		}
	}
</style>
