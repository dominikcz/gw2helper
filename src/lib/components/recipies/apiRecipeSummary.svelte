<script lang="ts">
	interface SearchItem {
		id: number;
		name: string;
		icon: string | null;
		rarity: string;
	}

	interface ApiIngredient {
		item_id?: number;
		id?: number;
		count?: number;
	}

	interface ApiRecipe {
		id: number;
		type?: string;
		output_item_count?: number;
		min_rating?: number;
		disciplines?: string[];
		ingredients?: ApiIngredient[];
	}

	interface Props {
		apiRecipes: ApiRecipe[];
		resolvedItems: Record<number, SearchItem>;
		onCreateCustom: () => void;
	}

	let { apiRecipes, resolvedItems, onCreateCustom }: Props = $props();
</script>

<div class="api-notice">
	<span class="api-badge">GW2 API</span>
	<span>This recipe comes from the GW2 API and cannot be edited.</span>
	<button class="btn-create-custom" onclick={onCreateCustom}>+ Create custom override</button>
</div>

{#each apiRecipes as recipe (recipe.id)}
	<div class="api-recipe-block">
		<div class="api-recipe-meta">
			<span class="meta-pill">Type: {recipe.type}</span>
			<span class="meta-pill">Output: {recipe.output_item_count ?? 1}</span>
			<span class="meta-pill">Rating: {recipe.min_rating ?? 0}</span>
			{#if recipe.disciplines?.length}
				<span class="meta-pill">{recipe.disciplines.join(', ')}</span>
			{/if}
		</div>
		{#if recipe.ingredients?.length}
			<div class="api-ings">
				{#each recipe.ingredients as ing (ing.item_id ?? ing.id)}
					{@const ingredientId = ing.item_id ?? ing.id ?? 0}
					{@const resolved = resolvedItems[ingredientId]}
					<div class="api-ing-row">
						<span class="ing-count-label">{ing.count}×</span>
						{#if resolved?.icon}<img src={resolved.icon} alt="" class="ing-icon-sm" />{/if}
						<span class={resolved?.rarity ? `rarity-${resolved.rarity.toLowerCase()}` : ''}>{resolved?.name ?? `#${ingredientId}`}</span>
					</div>
				{/each}
			</div>
		{/if}
	</div>
{/each}

<style>
	.api-notice { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 1rem; background: #1a1a1a; border: 1px solid #444; border-radius: 4px; margin-bottom: 1rem; font-size: 0.9rem; color: #aaa; flex-wrap: wrap; }
	.api-badge { background: #2a3a5a; color: #80aaff; padding: 0.15rem 0.5rem; border-radius: 3px; font-size: 0.75rem; font-weight: bold; }
	.btn-create-custom { margin-left: auto; padding: 0.3rem 0.75rem; background: #1a3a1a; color: #80ff80; border: 1px solid #2a5a2a; border-radius: 3px; cursor: pointer; font-size: 0.85rem; }
	.api-recipe-block { border: 1px solid #2a2a3a; border-radius: 4px; padding: 0.75rem; margin-bottom: 0.75rem; background: #111; }
	.api-recipe-meta { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.5rem; }
	.meta-pill { background: #1e2a1e; color: #8ac; padding: 0.1rem 0.45rem; border-radius: 3px; font-size: 0.78rem; }
	.api-ings { display: flex; flex-direction: column; gap: 0.25rem; }
	.api-ing-row { display: flex; align-items: center; gap: 0.4rem; font-size: 0.9rem; }
	.ing-count-label { color: #aaa; min-width: 2rem; text-align: right; }
	.ing-icon-sm { width: 20px; height: 20px; object-fit: contain; flex-shrink: 0; }
</style>
