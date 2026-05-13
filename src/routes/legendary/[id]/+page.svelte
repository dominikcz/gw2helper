<script lang="ts">
	import { resolve } from '$app/paths';
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

	const missingCount = $derived(rows.filter((row) => row.missing > 0).length);

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
	<p class="back-link"><a href={resolve('/legendary/')}>{$_('legendary.back_to_legendary')}</a></p>
	<h1>
		<ItemLabel
			id={data.details.targetItemId}
			name={data.details.targetItem?.name || `${$_('legendary.legendary')} #${data.details.targetItemId}`}
			icon={data.details.targetItem?.icon}
			rarity={data.details.targetItem?.rarity}
			href={wikiHref(data.details.targetItemId)}
			iconSize="4.2em"
		/>
	</h1>

	<section class="summary">
		<p>{$_('legendary.missing_ingredients_count')}: <strong>{missingCount}</strong></p>
		<p>
			{$_('legendary.total_missing_cost')} ({priceMode === 'buy' ? $_('legendary.buy_price') : $_('legendary.sell_price')}):
			<Price value={totalMissingCost} />
		</p>
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
				<button type="button" onclick={expandAll}>Expand all</button>
				<button type="button" onclick={collapseAll}>Collapse all</button>
			</div>
			{#snippet recipeNode(node: RecipeNode, path: string)}
			<li>
				<div class="node-row" class:owned={ownedCount(node.id) > 0} class:not-owned={ownedCount(node.id) === 0}>
					{#if node.children.length > 0}
						<button type="button" class="tree-toggle" onclick={() => toggleNode(path)} aria-label={isExpanded(path) ? 'Collapse node' : 'Expand node'}>
							{isExpanded(path) ? '▾' : '▸'}
						</button>
					{:else}
						<span class="tree-leaf" aria-hidden="true"></span>
					{/if}
					<ItemLabel
						id={node.id}
						name={itemInfo(node.id)?.name}
						icon={itemInfo(node.id)?.icon}
						rarity={itemInfo(node.id)?.rarity}
						count={node.count}
						showCount={true}
						countOnIcon={true}
						href={wikiHref(node.id)}
						crossed={ownedCount(node.id) > 0}
					/>
					<span class="node-progress" title={`owned ${ownedCount(node.id)} / required ${node.count}`}>
						<Progress
							max={nodeProgressMax(node.count)}
							value={nodeProgressValue(node.id, node.count)}
							label={nodeProgressLabel(node.id, node.count)}
						/>
					</span>
					{#if node.cycle}
						<span class="chip warning">cycle</span>
					{/if}
				</div>
				{#if node.children.length > 0 && isExpanded(path)}
					<ul>
						{#each node.children as child, idx (`${path}.${child.id}-${idx}`)}
							{@render recipeNode(child, `${path}.${child.id}-${idx}`)}
						{/each}
					</ul>
				{/if}
			</li>
			{/snippet}
			<ul class="tree-root">
				{@render recipeNode(data.details.recipeTree as RecipeNode, 'root')}
			</ul>
		{/if}
	</section>

	<section>
		<h2>{$_('legendary.ingredients')}</h2>
		{#if data.details.recipeAvailable}
			<table>
				<thead>
					<tr>
						<th>{$_('legendary.ingredient')}</th>
						<th>{$_('legendary.required')}</th>
						<th>{$_('legendary.owned')}</th>
						<th>{$_('legendary.missing')}</th>
						<th>{$_('legendary.unit_price')}</th>
						<th>{$_('legendary.missing_cost')}</th>
						<th>{$_('legendary.tp_status')}</th>
					</tr>
				</thead>
				<tbody>
					{#each rows as row (row.id)}
						{@const info = itemInfo(row.id)}
						{@const unit = priceMode === 'buy' ? row.buyUnit : row.sellUnit}
						{@const rowCost = row.missing > 0 && unit != null && row.tpReason === 'ok' ? unit * row.missing : null}
						<tr class:done={row.missing === 0}>
							<td class="ingredient-name">
								{#if info?.icon}<img src={info.icon} alt={info.name || String(row.id)} />{/if}
								<span>{info?.name || `#${row.id}`}</span>
							</td>
							<td>{row.required}</td>
							<td>{row.owned}</td>
							<td>{row.missing}</td>
							<td>
								{#if unit != null && row.tpReason === 'ok'}
									<Price value={unit} />
								{:else}
									-
								{/if}
							</td>
							<td>
								{#if rowCost != null}
									<Price value={rowCost} />
								{:else}
									-
								{/if}
							</td>
							<td>{tpReasonLabel(row.tpReason)}</td>
						</tr>
					{/each}
				</tbody>
			</table>
		{:else}
			<p>{$_('legendary.recipe_unavailable')}</p>
		{/if}
	</section>
{/if}

<style lang="scss">
	h1 {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.summary {
		display: flex;
		flex-wrap: wrap;
		gap: 1rem;
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
	}

	.tree-root li {
		margin: 0.45rem 0;
	}

	.node-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		flex-wrap: wrap;
		padding: 0.45em 0.35em;
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
		padding: 0;
		background: transparent;
		border: none;
		cursor: pointer;
		color: inherit;
	}

	.node-progress {
		display: inline-flex;
		align-items: center;
		margin-left: auto;
		flex: 0 0 auto;
	}

	.warning {
		color: #fba6a6;
	}

	table {
		width: 100%;
		border-collapse: collapse;
	}

	th,
	td {
		padding: 0.35rem;
		text-align: left;
	}

	thead tr {
		border-bottom: 1px solid rgba(255, 255, 255, 0.2);
	}

	tbody tr {
		border-bottom: 1px dashed rgba(255, 255, 255, 0.15);
	}

	tr.done {
		opacity: 0.65;
	}

	.ingredient-name {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.ingredient-name img {
		width: 1.2rem;
		height: 1.2rem;
	}

	@media (max-width: 760px) {
		table {
			font-size: 0.85rem;
		}
	}
</style>
