<script lang="ts">
	import { asset, resolve } from '$app/paths';
	import { SvelteSet } from 'svelte/reactivity';
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
	let priceMode = $state<'buy' | 'sell'>('buy');
	type RecipeNode = NonNullable<NonNullable<PageData['details']>['recipeTree']>;
	const expandedNodes = new SvelteSet<string>(['root']);

	const rows = $derived(data.details?.ingredients || []);
	const totalMissingCost = $derived(
		rows.reduce((sum, row) => {
			if (!row.missing || row.tpReason !== 'ok') return sum;
			const unit = priceMode === 'buy' ? row.buyUnit : row.sellUnit;
			if (unit == null) return sum;
			const lineCost = unit * row.missing;
			if (!Number.isFinite(lineCost) || lineCost < 0) return sum;
			return sum + lineCost;
		}, 0)
	);

	const rowById = $derived(new Map(rows.map((row) => [row.id, row] as const)));

	function itemInfo(id: number) {
		return data.details?.itemsById?.[id];
	}

	function tpReasonLabel(reason: 'ok' | 'bound' | 'no-listing') {
		if (reason === 'bound') return $_('legendary.tp_status_bound');
		if (reason === 'no-listing') return $_('legendary.tp_status_no_listing');
		return $_('legendary.tp_status_ok');
	}

	function ownedCount(id: number) {
		return data.details?.ownedById?.[id] || 0;
	}

	function wikiHref(id: number) {
		const name = itemInfo(id)?.name;
		return name ? helperUtils.wikiLink(name) : undefined;
	}

	function nodeProgressMax(required: number) {
		return Math.max(1, required);
	}

	function nodeProgressValue(id: number, required: number) {
		return Math.min(nodeProgressMax(required), ownedCount(id));
	}

	function nodeProgressLabel(id: number, required: number) {
		const owned = Math.min(nodeProgressMax(required), ownedCount(id));
		return `${owned}/${required}`;
	}

	function nodeEnough(id: number, required: number) {
		return ownedCount(id) >= required;
	}

	function nodeMissing(id: number, required: number) {
		return Math.max(0, required - ownedCount(id));
	}

	function nodeDirectMissingCost(id: number, required: number) {
		const row = rowById.get(id);
		if (!row || row.tpReason !== 'ok') return null;
		const unit = priceMode === 'buy' ? row.buyUnit : row.sellUnit;
		if (unit == null) return null;
		const missing = nodeMissing(id, required);
		if (missing <= 0) return 0;
		return unit * missing;
	}

	function nodeMissingCost(node: RecipeNode): number | null {
		if (node.cycle) return null;
		const directCost = nodeDirectMissingCost(node.id, node.count);
		if (!node.children.length) return directCost;

		let total = 0;
		let hasChildCost = false;
		for (const child of node.children) {
			const childCost = nodeMissingCost(child);
			if (childCost == null) continue;
			hasChildCost = true;
			total += childCost;
		}

		if (hasChildCost) return total;
		return directCost;
	}

	function canExpandNode(node: RecipeNode) {
		return node.children.length > 0 && !nodeEnough(node.id, node.count);
	}

	function isInteractiveTarget(target: EventTarget | null) {
		if (!(target instanceof Element)) return false;
		return Boolean(target.closest('a, button, input, select, textarea, label'));
	}

	function onNodeRowClick(event: MouseEvent, node: RecipeNode, path: string) {
		if (!canExpandNode(node)) return;
		if (isInteractiveTarget(event.target)) return;
		toggleNode(path);
	}

	function onNodeRowKeydown(event: KeyboardEvent, node: RecipeNode, path: string) {
		if (!canExpandNode(node)) return;
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
		if (!canExpandNode(node)) return;
		node.children.forEach((child, idx) => collectPaths(child, `${path}.${child.id}-${idx}`, out));
	}

	function expandAll() {
		if (!data.details?.recipeTree) return;
		const next = new Set<string>();
		collectPaths(data.details.recipeTree as RecipeNode, 'root', next);
		expandedNodes.clear();
		next.forEach((path) => expandedNodes.add(path));
	}

	function collapseAll() {
		expandedNodes.clear();
		expandedNodes.add('root');
	}
</script>

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
			id={data.details.targetItemId}
			name={data.details.targetItem?.name || `${$_('legendary.legendary')} #${data.details.targetItemId}`}
			icon={data.details.targetItem?.icon}
			href={wikiHref(data.details.targetItemId)}
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
		{#if !data.details.recipeAvailable}
			<p>{$_('legendary.recipe_unavailable')}</p>
		{:else}
			<div class="tree-controls">
				<button type="button" onclick={expandAll}>{$_('legendary.expand_all')}</button>
				<button type="button" onclick={collapseAll}>{$_('legendary.collapse_all')}</button>
			</div>
			{#snippet recipeNode(node: RecipeNode, path: string)}
			{@const missingCost = nodeMissingCost(node)}
			<li>
				<div
					class="node-row"
					class:owned={nodeEnough(node.id, node.count)}
					class:not-owned={!nodeEnough(node.id, node.count)}
					onclick={(event) => onNodeRowClick(event, node, path)}
					onkeydown={(event) => onNodeRowKeydown(event, node, path)}
					role="button"
					tabindex="0"
					aria-expanded={canExpandNode(node) ? isExpanded(path) : undefined}
				>
					{#if canExpandNode(node)}
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
					<span
						class="node-progress"
						title={$_('legendary.progress_owned_required', { owned: ownedCount(node.id), required: node.count })}
					>
						{#if missingCost != null}
							<span class="node-cost"><Price value={missingCost} /></span>
						{/if}
						<Progress
							max={nodeProgressMax(node.count)}
							value={nodeProgressValue(node.id, node.count)}
							label={nodeProgressLabel(node.id, node.count)}
						/>
					</span>
					{#if node.cycle}
						<span class="chip warning">{$_('legendary.cycle')}</span>
					{/if}
				</div>
				{#if canExpandNode(node) && isExpanded(path)}
					<ul>
						{#each node.children as child, idx (`${path}.${child.id}-${idx}`)}
							{@render recipeNode(child, `${path}.${child.id}-${idx}`)}
						{/each}
					</ul>
				{/if}
			</li>
			{/snippet}
			<ul class="tree-root">
				{#each ((data.details.recipeTree as RecipeNode).children || []) as child, idx (`root.${child.id}-${idx}`)}
					{@render recipeNode(child, `root.${child.id}-${idx}`)}
				{/each}
			</ul>
		{/if}
	</section>

	<section>
		<h2>{$_('legendary.missing_ingredients_count')}</h2>
		{#if data.details.recipeAvailable}
			<table>
				<thead>
					<tr>
						<th colspan="2">{$_('legendary.ingredient')}</th>
						<th class="num-col">{$_('legendary.unit_price')}</th>
						<th class="num-col">{$_('legendary.total_cost')}</th>
					</tr>
				</thead>
				<tbody>
					{#each rows as row (row.id)}
						{@const info = itemInfo(row.id)}
						{@const wiki = wikiHref(row.id)}
						{@const unit = priceMode === 'buy' ? row.buyUnit : row.sellUnit}
						{@const rowCost = row.missing > 0 && unit != null && row.tpReason === 'ok' ? unit * row.missing : null}
						<tr class:done={row.missing === 0}>
							<td class="num-col">{row.missing}</td>
							<td class="ingredient-cell">
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
							</td>
							<td class="num-col">
								{#if unit != null && row.tpReason === 'ok'}
									<Price value={unit} />
								{:else}
									-
								{/if}
							</td>
							<td class="num-col">
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

		table {
			font-size: 0.85rem;
		}
	}
</style>
