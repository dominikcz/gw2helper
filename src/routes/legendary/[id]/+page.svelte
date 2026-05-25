<script lang="ts">
	import { asset, resolve } from '$app/paths';
	import { SvelteMap } from 'svelte/reactivity';
	import Awaiter from '$lib/components/ui/awaiter.svelte';
	import ItemLabel from '$lib/components/items/itemLabel.svelte';
	import { t as _ } from '$lib/services/i18n';
	import helperUtils from '$lib/utils/helper-utils';
	import type { PageData } from './$types';
	import type { RecipeTreeNode } from '$lib/legendary/calculator-types';
	import RecipeTree from '$lib/components/legendary/recipeTree.svelte';
	import IngredientsTable from '$lib/components/legendary/ingredientsTable.svelte';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();
	type LegendaryDetails = NonNullable<Awaited<PageData['details']>>;
	let priceMode = $state<'buy' | 'sell'>('buy');
	const decisionOverrides = new SvelteMap<string, 'tp' | 'craft' | 'vendor'>();
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

	function setDecision(id: number, decision: 'tp' | 'craft' | 'vendor') {
		decisionOverrides.set(`${priceMode}:${id}`, decision);
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
			href={resolvedDetails?.targetItem?.name ? helperUtils.wikiLink(resolvedDetails.targetItem.name) : undefined}
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
					<RecipeTree
						recipeTree={details.recipeTree as RecipeTreeNode}
						{rows}
						itemsById={resolvedDetails?.itemsById || {}}
						ownedById={resolvedDetails?.ownedById || {}}
						{priceMode}
						{decisionOverrides}
						onSetDecision={setDecision}
					/>
				{/if}
			{/snippet}
		</Awaiter>
	</section>

	<section>
		<h2>{$_('legendary.missing_ingredients_count')}</h2>
		<Awaiter promise={detailsPromise as Promise<LegendaryDetails> | LegendaryDetails}>
			{#snippet children(details)}
				{#if details.recipeAvailable}
					<IngredientsTable
						{rows}
						itemsById={resolvedDetails?.itemsById || {}}
						{priceMode}
						{decisionOverrides}
						onSetDecision={setDecision}
					/>
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
		max-width: 80%;
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
		white-space: normal;
		overflow: visible;
		text-overflow: unset;
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

	:global(.neutral-label .icon-frame) {
		outline-color: #000;
	}

	:global(.neutral-label .caption) {
		color: inherit;
	}

	:global(.decision) {
		font-weight: 700;
	}

	@media (max-width: 760px) {
		.legendary-hero {
			width: 100%;
			max-width: 100%;
		}
	}
</style>