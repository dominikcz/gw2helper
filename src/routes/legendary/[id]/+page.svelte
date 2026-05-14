<script lang="ts">
	import { asset, resolve } from '$app/paths';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import Awaiter from '$lib/components/ui/awaiter.svelte';
	import Price from '$lib/components/currencies/price.svelte';
	import ItemLabel from '$lib/components/items/itemLabel.svelte';
	import Progress from '$lib/components/progress/progress.svelte';
	import { t as _ } from '$lib/services/i18n';
	import helperUtils from '$lib/utils/helper-utils';
	import type { PageData } from './$types';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	type LegendaryDetails = NonNullable<Awaited<PageData['details']>>;
	let priceMode = $state<'buy' | 'sell'>('buy');
	type RecipeNode = NonNullable<LegendaryDetails['recipeTree']>;
	const expandedNodes = new SvelteSet<string>(['root']);
	const decisionOverrides = new SvelteMap<string, 'tp' | 'craft'>();
	let resolvedDetails = $state<LegendaryDetails | null>(null);

	const detailsPromise = $derived(data.details as Promise<LegendaryDetails> | LegendaryDetails | null);

	$effect(() => {
		const current = data.details as Promise<LegendaryDetails> | LegendaryDetails | null;
		if (!current) {
			resolvedDetails = null;
			return;
		}

		if (typeof (current as Promise<LegendaryDetails>).then === 'function') {
			let active = true;
			(current as Promise<LegendaryDetails>)
				.then((next) => {
					if (active) resolvedDetails = next;
				})
				.catch(() => {
					if (active) resolvedDetails = null;
				});

			return () => {
				active = false;
			};
		}

		resolvedDetails = current as LegendaryDetails;
	});

	const rows = $derived(resolvedDetails?.ingredients || []);
	const pageTitle = $derived(
		resolvedDetails?.targetItem?.name
			? `GW2 Helper - ${resolvedDetails.targetItem.name}`
			: data.targetItemId
				? `GW2 Helper - Legendary #${data.targetItemId}`
				: 'GW2 Helper - Legendary'
	);
	const totalMissingCost = $derived(
		rows.reduce((sum, row) => {
			if (!row.missing) return sum;
			const unit = rowUnit(row);
			if (unit == null) return sum;
			const lineCost = unit * row.missing;
			if (!Number.isFinite(lineCost) || lineCost < 0) return sum;
			return sum + lineCost;
		}, 0)
	);

	const rowById = $derived(new SvelteMap(rows.map((row) => [row.id, row] as const)));
	type PathMetric = { missing: number; cost: number | null };
	const treeMetricsByPath = $derived.by(() => {
		const out = new SvelteMap<string, PathMetric>();
		const root = resolvedDetails?.recipeTree as RecipeNode | null | undefined;
		if (!root) return out;

		const ownedPool = new SvelteMap<number, number>();
		for (const [id, count] of Object.entries(resolvedDetails?.ownedById || {})) {
			const numId = Number(id);
			const numCount = Number(count || 0);
			if (!Number.isFinite(numId) || numId <= 0 || !Number.isFinite(numCount) || numCount <= 0) continue;
			ownedPool.set(numId, numCount);
		}

		const visit = (node: RecipeNode, path: string): PathMetric => {
			if (node.cycle) {
				const metric = { missing: node.count, cost: null };
				out.set(path, metric);
				return metric;
			}

			const available = ownedPool.get(node.id) || 0;
			const consumed = Math.min(available, node.count);
			if (consumed > 0) {
				ownedPool.set(node.id, available - consumed);
			}

			const missing = Math.max(0, node.count - consumed);
			if (missing <= 0) {
				const metric = { missing: 0, cost: 0 };
				out.set(path, metric);
				return metric;
			}

			const row = rowById.get(node.id);
			const unit = row ? rowUnit(row) : null;
			const directCost = unit != null ? unit * missing : null;

			// If this node has an explicit acquisition strategy row, stop here.
			// This prevents deep expansion of market-material conversion chains.
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
	});

	function itemInfo(id: number) {
		return resolvedDetails?.itemsById?.[id];
	}

	function decisionLabel(decision: 'tp' | 'craft' | 'none') {
		if (decision === 'tp') return 'TP';
		if (decision === 'craft') return 'CRAFT';
		return '-';
	}

	function decisionKey(id: number) {
		return `${priceMode}:${id}`;
	}

	function setDecision(id: number, decision: 'tp' | 'craft') {
		decisionOverrides.set(decisionKey(id), decision);
	}

	function rowTpUnit(row: (typeof rows)[number]) {
		return priceMode === 'buy' ? row.buyUnit : row.sellUnit;
	}

	function rowCraftUnit(row: (typeof rows)[number]) {
		return priceMode === 'buy' ? row.craftBuyUnit : row.craftSellUnit;
	}

	function rowDecision(row: (typeof rows)[number]) {
		return priceMode === 'buy' ? row.bestBuySource : row.bestSellSource;
	}

	function rowHasSource(row: (typeof rows)[number], source: 'tp' | 'craft') {
		const unit = source === 'tp' ? rowTpUnit(row) : rowCraftUnit(row);
		return unit != null && Number.isFinite(unit) && unit >= 0;
	}

	function rowHasMultipleSources(row: (typeof rows)[number]) {
		return rowHasSource(row, 'tp') && rowHasSource(row, 'craft');
	}

	function effectiveDecision(row: (typeof rows)[number]): 'tp' | 'craft' | 'none' {
		const override = decisionOverrides.get(decisionKey(row.id));
		if (override && rowHasSource(row, override)) return override;

		const auto = rowDecision(row);
		if ((auto === 'tp' || auto === 'craft') && rowHasSource(row, auto)) return auto;

		if (rowHasSource(row, 'tp')) return 'tp';
		if (rowHasSource(row, 'craft')) return 'craft';
		return 'none';
	}

	function rowUnit(row: (typeof rows)[number]) {
		const decision = effectiveDecision(row);
		if (decision === 'tp') return rowTpUnit(row);
		if (decision === 'craft') return rowCraftUnit(row);
		return null;
	}

	function ownedCount(id: number) {
		return resolvedDetails?.ownedById?.[id] || 0;
	}

	function wikiHref(id: number) {
		const name = itemInfo(id)?.name;
		return name ? helperUtils.wikiLink(name) : undefined;
	}

	function nodeProgressMax(required: number) {
		return Math.max(1, required);
	}

	function nodeMissing(id: number, required: number) {
		return Math.max(0, required - ownedCount(id));
	}

	function nodeMissingAtPath(node: RecipeNode, path: string) {
		const metric = treeMetricsByPath.get(path);
		if (metric) return metric.missing;
		return nodeMissing(node.id, node.count);
	}

	function nodeProgressValueAtPath(node: RecipeNode, path: string) {
		const missing = nodeMissingAtPath(node, path);
		const fulfilled = Math.max(0, node.count - missing);
		return Math.min(nodeProgressMax(node.count), fulfilled);
	}

	function nodeProgressLabelAtPath(node: RecipeNode, path: string) {
		const missing = nodeMissingAtPath(node, path);
		const fulfilled = Math.max(0, node.count - missing);
		return `${fulfilled}/${node.count}`;
	}

	function canExpandNode(node: RecipeNode, path: string) {
		if (rowById.has(node.id)) return false;
		return node.children.length > 0 && nodeMissingAtPath(node, path) > 0;
	}

	function isInteractiveTarget(target: EventTarget | null) {
		if (!(target instanceof Element)) return false;
		return Boolean(target.closest('a, button, input, select, textarea, label'));
	}

	function onNodeRowClick(event: MouseEvent, node: RecipeNode, path: string) {
		if (!canExpandNode(node, path)) return;
		if (isInteractiveTarget(event.target)) return;
		toggleNode(path);
	}

	function onNodeRowKeydown(event: KeyboardEvent, node: RecipeNode, path: string) {
		if (!canExpandNode(node, path)) return;
		if (event.key !== 'Enter' && event.key !== ' ') return;
		event.preventDefault();
		toggleNode(path);
	}

	function isExpanded(path: string) {
		return expandedNodes.has(path);
	}

	function toggleNode(path: string) {
		if (expandedNodes.has(path)) {
			expandedNodes.delete(path);
		} else {
			expandedNodes.add(path);
		}
	}

	function collectPaths(node: RecipeNode, path: string, out: Set<string>) {
		out.add(path);
		if (!canExpandNode(node, path)) return;
		node.children.forEach((child, idx) => collectPaths(child, `${path}.${child.id}-${idx}`, out));
	}

	function expandAll() {
		if (!resolvedDetails?.recipeTree) return;
		const next = new Set<string>();
		collectPaths(resolvedDetails.recipeTree as RecipeNode, 'root', next);
		expandedNodes.clear();
		next.forEach((path) => expandedNodes.add(path));
	}

	function collapseAll() {
		expandedNodes.clear();
		expandedNodes.add('root');
	}
</script>

<svelte:head>
	<title>{pageTitle}</title>
</svelte:head>

{#if !data.details}
	<h1>{$_('legendary.legendary')}</h1>
	<p>{$_('layout.no_token')}</p>
{:else}
	<p>
		<a class="back-link" href={resolve('/legendary/')}>
			<img src={asset('/assets/Game_menu_return_icon.png')} alt="" aria-hidden="true" />
			<span>{$_('legendary.back_to_legendary')}</span>
		</a>
	</p>

	<section class="legendary-hero grunge-border">
		<img class="hero-art" src={asset('/assets/550px-Legendary_unlock_book.png')} alt="" aria-hidden="true" />
		<ItemLabel
			class="neutral-label hero-item"
			id={resolvedDetails?.targetItemId || data.targetItemId}
			name={resolvedDetails?.targetItem?.name || `${$_('legendary.legendary')} #${data.targetItemId}`}
			icon={resolvedDetails?.targetItem?.icon}
			href={wikiHref(resolvedDetails?.targetItemId || data.targetItemId)}
			linkTitle={$_('common.click_for_wiki')}
			linkCaption={true}
			iconSize="3.1rem"
		/>
	</section>

	<section class="price-switch">
		<label for="price-mode">{$_('legendary.price_mode')}:</label>
		<select id="price-mode" bind:value={priceMode}>
			<option value="buy">{$_('legendary.buy_price')}</option>
			<option value="sell">{$_('legendary.sell_price')}</option>
		</select>
	</section>

	<section>
		<h2>{$_('legendary.recipe_tree')}</h2>
		<Awaiter promise={detailsPromise as Promise<LegendaryDetails> | LegendaryDetails}>
			{#snippet children(details)}
				{#if !details.recipeAvailable}
					<p>{$_('legendary.recipe_unavailable')}</p>
				{:else}
			<div class="tree-controls">
				<button type="button" onclick={expandAll}>{$_('legendary.expand_all')}</button>
				<button type="button" onclick={collapseAll}>{$_('legendary.collapse_all')}</button>
			</div>
			{#snippet recipeNode(node: RecipeNode, path: string)}
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
						id={node.id}
						name={itemInfo(node.id)?.name}
						icon={itemInfo(node.id)?.icon}
						iconSize="40px"
						count={node.count}
						showCount={true}
						countOnIcon={true}
						href={wikiHref(node.id)}
						linkTitle={$_('common.click_for_wiki')}
					/>
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
						{#if missingCost != null && missingCost > 0}
							<span class="node-cost"><Price value={missingCost} /></span>
							{@const nodeRow = rowById.get(node.id)}
							{#if nodeRow && missingCount > 0}
								<span class="node-strategy" title="Optimal acquisition">
									{#if rowHasSource(nodeRow, 'tp')}
										<label class="strategy-line">
											<input
												type="radio"
														name={`acq-tree-${priceMode}-${nodeRow.id}-${path}`}
												disabled={!rowHasMultipleSources(nodeRow)}
												checked={effectiveDecision(nodeRow) === 'tp'}
														onclick={() => setDecision(nodeRow.id, 'tp')}
											/>
											<span class="strategy-name">TP</span>
											<span class="strategy-price"><Price value={(rowTpUnit(nodeRow) as number) * missingCount} compact={false} /></span>
										</label>
									{/if}
									{#if rowHasSource(nodeRow, 'craft')}
										<label class="strategy-line">
											<input
												type="radio"
														name={`acq-tree-${priceMode}-${nodeRow.id}-${path}`}
												disabled={!rowHasMultipleSources(nodeRow)}
												checked={effectiveDecision(nodeRow) === 'craft'}
														onclick={() => setDecision(nodeRow.id, 'craft')}
											/>
											<span class="strategy-name">CRAFT</span>
											<span class="strategy-price"><Price value={(rowCraftUnit(nodeRow) as number) * missingCount} compact={false} /></span>
										</label>
									{/if}
								</span>
							{/if}
						{/if}
						<Progress
							max={nodeProgressMax(node.count)}
							value={nodeProgressValueAtPath(node, path)}
							label={nodeProgressLabelAtPath(node, path)}
						/>
					</span>
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
				{#each ((details.recipeTree as RecipeNode).children || []) as child, idx (`root.${child.id}-${idx}`)}
					{@render recipeNode(child, `root.${child.id}-${idx}`)}
				{/each}
			</ul>
				{/if}
			{/snippet}
		</Awaiter>
	</section>

	<section>
		<h2>{$_('legendary.missing_ingredients_count')}</h2>
		<Awaiter promise={detailsPromise as Promise<LegendaryDetails> | LegendaryDetails}>
			{#snippet children(details)}
				{#if details.recipeAvailable}
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
						{@const unit = rowUnit(row)}
						{@const rowCost = row.missing > 0 && unit != null ? unit * row.missing : null}
						<tr class:done={row.missing === 0}>
							<td class="num-col">{row.missing}</td>
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
											{#if rowHasSource(row, 'tp')}
												<label class="strategy-line">
													<input
														type="radio"
														name={`acq-mobile-${priceMode}-${row.id}`}
														disabled={!rowHasMultipleSources(row)}
														checked={effectiveDecision(row) === 'tp'}
														onclick={() => setDecision(row.id, 'tp')}
													/>
													<span class="strategy-name">TP</span>
													<span class="strategy-price"><Price value={rowTpUnit(row) as number} compact={false} /></span>
												</label>
											{/if}
											{#if rowHasSource(row, 'craft')}
												<label class="strategy-line">
													<input
														type="radio"
														name={`acq-mobile-${priceMode}-${row.id}`}
														disabled={!rowHasMultipleSources(row)}
														checked={effectiveDecision(row) === 'craft'}
														onclick={() => setDecision(row.id, 'craft')}
													/>
													<span class="strategy-name">CRAFT</span>
													<span class="strategy-price"><Price value={rowCraftUnit(row) as number} compact={false} /></span>
												</label>
											{/if}
										</div>
									</div>
								</div>
							</td>
							<td class="num-col unit-col">
								<div class="price-options">
									{#if rowHasSource(row, 'tp')}
										<label class="strategy-line">
											<input
												type="radio"
														name={`acq-table-${priceMode}-${row.id}`}
												disabled={!rowHasMultipleSources(row)}
												checked={effectiveDecision(row) === 'tp'}
														onclick={() => setDecision(row.id, 'tp')}
											/>
											<span class="strategy-name">TP</span>
											<span class="strategy-price"><Price value={rowTpUnit(row) as number} compact={false} /></span>
										</label>
									{/if}
									{#if rowHasSource(row, 'craft')}
										<label class="strategy-line">
											<input
												type="radio"
														name={`acq-table-${priceMode}-${row.id}`}
												disabled={!rowHasMultipleSources(row)}
												checked={effectiveDecision(row) === 'craft'}
														onclick={() => setDecision(row.id, 'craft')}
											/>
											<span class="strategy-name">CRAFT</span>
											<span class="strategy-price"><Price value={rowCraftUnit(row) as number} compact={false} /></span>
										</label>
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
				{:else}
					<p>{$_('legendary.recipe_unavailable')}</p>
				{/if}
			{/snippet}
		</Awaiter>
	</section>
{/if}

<style lang="scss">
	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.45em;

		img {
			width: 1.3em;
			height: 1.3em;
			object-fit: contain;
		}
	}

	.legendary-hero {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 2em;
		margin: 0.7rem auto 1rem;
		width: 38rem;
		max-width: 50%;
		padding: 0.75rem;
		background:
			radial-gradient(circle at 18% 28%, rgba(190, 150, 70, 0.2), transparent 56%),
			linear-gradient(160deg, rgba(48, 33, 19, 0.9), rgba(28, 21, 18, 0.85));
		border: 1px solid rgba(206, 177, 118, 0.35);
		border-radius: 0;
		overflow: hidden;
	}

	.legendary-hero :global(.item-label) {
		gap: 2em;
	}

	.legendary-hero.grunge-border {
		mask-position: 250px bottom;
	}

	.hero-art {
		width: 100%;
		border-radius: 0;
		opacity: 0.9;
		filter: saturate(1.05) contrast(1.05);
	}

	:global(.hero-item) {
		display: inline-flex;
		flex-direction: row;
		align-items: center;
		gap: 1em !important;
		max-width: 100%;
	}

	:global(.hero-item .caption) {
		font-size: 2em;
		font-weight: 700;
		max-width: 11.5rem;
	}

	h1 {
		margin: 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.price-switch {
		margin: 0.8rem 0;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

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
	}

	.tree-toggle.expanded {
		transform: rotate(90deg);
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

	.strategy-line {
		display: grid;
		grid-template-columns: auto 3.7rem minmax(7.5rem, 1fr);
		align-items: center;
		column-gap: 0.3rem;
		width: 100%;
	}

	.strategy-line input[type='radio'] {
		margin: 0;
	}

	.strategy-name {
		font-weight: 700;
		text-align: left;
	}

	.strategy-price {
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

	.mobile-pricing .strategy-line {
		grid-template-columns: auto 3.2rem minmax(0, 1fr);
	}

	.mobile-pricing .strategy-price {
		overflow-wrap: anywhere;
	}

	.ingredient-main-line {
		display: block;
	}

	.mobile-inline-total {
		display: none;
	}

	:global(.decision) {
		font-weight: 700;
	}

	.node-missing-inline {
		opacity: 0.85;
		font-size: 0.9em;
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

	.warning {
		color: #fba6a6;
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

	tfoot .summary-row {
		border-top: 1px solid rgba(255, 255, 255, 0.2);
	}

	tfoot .summary-row td {
		font-weight: 600;
	}

	tr.done {
		opacity: 0.65;
	}

	.ingredient-cell{
		padding-right: 3em;
	}

	.ingredient-cell :global(.item-label) {
		display: inline-flex;
		align-items: center;
		max-width: 100%;
	}

	:global(.neutral-label .icon-frame) {
		outline-color: #000;
	}

	:global(.neutral-label .caption) {
		color: inherit;
	}

	.ingredient-cell :global(.caption) {
		max-width: min(28rem, 55vw);
	}

	@media (max-width: 760px) {
		.legendary-hero {
			width: 100%;
			max-width: 100%;
		}

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

		.node-strategy .strategy-line {
			display: flex;
			align-items: center;
			flex-wrap: wrap;
			column-gap: 0.35rem;
			row-gap: 0.15rem;
		}

		.node-strategy .strategy-price {
			margin-left: auto;
			overflow-wrap: anywhere;
		}

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
