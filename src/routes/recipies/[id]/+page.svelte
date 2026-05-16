<script lang="ts">
	import type { PageData } from './$types';
	import { resolve } from '$app/paths';
	import { beforeNavigate } from '$app/navigation';
	import Price from '$lib/components/currencies/price.svelte';

	interface Ingredient { item_id: number; count: number; }
	interface VendorCost { amount: number; item_name: string; icon_url?: string; }
	interface Vendor { name: string; cost: VendorCost[]; gold_cost?: number; }
	interface RecipeForm {
		type: string;
		output_item_id: number;
		output_item_count: number;
		time_to_craft_ms: number;
		disciplines: string[];
		min_rating: number;
		flags: string[];
		ingredients: Ingredient[];
		acquisition?: { vendors: Vendor[] };
	}
	interface SearchItem { id: number; name: string; icon: string | null; rarity: string; }
	interface IngSearch { searching: boolean; query: string; results: SearchItem[]; loading: boolean; }

	let { data }: { data: PageData } = $props();

	const stackIds = $derived(data.stack ? data.stack.split(',').filter(Boolean).map(Number) : []);

	// Separate API recipes (id > 0) from custom recipe (id === 0)
	const apiRecipes = $derived((data.existingRecipes ?? []).filter((r: any) => r.id > 0));
	const customRecipe = $derived((data.existingRecipes ?? []).find((r: any) => r.id === 0) ?? null);
	const isApiOnly = $derived(apiRecipes.length > 0 && !customRecipe);

	function initForm(): RecipeForm {
		const existing = customRecipe ?? apiRecipes[0] ?? null;
		if (existing) {
			return {
				type: existing.type ?? 'Inscription',
				output_item_id: existing.output_item_id ?? data.id,
				output_item_count: existing.output_item_count ?? 1,
				time_to_craft_ms: existing.time_to_craft_ms ?? 1000,
				disciplines: existing.disciplines ?? [],
				min_rating: existing.min_rating ?? 0,
				flags: existing.flags ?? [],
				ingredients: (existing.ingredients ?? []).map((ing: any) => ({
					item_id: ing.item_id ?? ing.id ?? 0,
					count: ing.count ?? 1,
				})),
				acquisition: existing.acquisition ?? { vendors: [] }
			};
		}
		return {
			type: 'Inscription',
			output_item_id: data.id,
			output_item_count: 1,
			time_to_craft_ms: 1000,
			disciplines: [],
			min_rating: 0,
			flags: [],
			ingredients: [],
			acquisition: { vendors: [] }
		};
	}

	let form = $state<RecipeForm>(initForm());
	let editMode = $state(!isApiOnly);
	let isDirty = $state(false);

	// Per-ingredient resolved item info
	let resolvedItems = $state<Record<number, SearchItem>>({});
	// Per-ingredient search state (indexed by ingredient index)
	let ingSearches = $state<IngSearch[]>([]);

	// Reset all state when navigating to a different item (drill down / back)
	$effect(() => {
		const _id = data.id;
		form = initForm();
		editMode = !isApiOnly;
		resolvedItems = {};
		ingSearches = [];
		isDirty = false;
	});

	beforeNavigate(({ cancel }) => {
		if (isDirty && !confirm('Masz niezapisane zmiany. Opuścić stronę?')) {
			cancel();
		}
	});

	// Mark dirty on any form field change; skip first run after id change
	let _dirtyWatchId = 0; // plain variable — not reactive, won't re-trigger the effect
	$effect(() => {
		void form.type; void form.output_item_count; void form.min_rating;
		void form.disciplines.length; void form.ingredients.length;
		void form.acquisition?.vendors.length;
		if (_dirtyWatchId === data.id) {
			isDirty = true;
		} else {
			_dirtyWatchId = data.id;
		}
	});

	function ensureSearchStates() {
		while (ingSearches.length < form.ingredients.length) {
			ingSearches.push({ searching: false, query: '', results: [], loading: false });
		}
		if (ingSearches.length > form.ingredients.length) {
			ingSearches = ingSearches.slice(0, form.ingredients.length);
		}
	}

	// Resolve names for all ingredient IDs (form + API recipes)
	async function resolveIngredientNames() {
		const formIds = form.ingredients.map(i => i.item_id).filter(id => id > 0);
		const apiIds = apiRecipes.flatMap((r: any) => (r.ingredients ?? []).map((ing: any) => ing.item_id ?? ing.id ?? 0)).filter((id: number) => id > 0);
		const ids = [...new Set([...formIds, ...apiIds])];
		if (!ids.length) return;
		const missing = ids.filter(id => !resolvedItems[id]);
		if (!missing.length) return;
		try {
			const res = await fetch(resolve('/recipies/api/items') + '?ids=' + missing.join(','));
			if (!res.ok) return;
			const { items } = await res.json();
			const update: Record<number, SearchItem> = { ...resolvedItems };
			for (const item of items) update[item.id] = item;
			resolvedItems = update;
		} catch {}
	}

	$effect(() => {
		ensureSearchStates();
		resolveIngredientNames();
	});

	let searchTimers: ReturnType<typeof setTimeout>[] = [];

	async function searchItems(idx: number, query: string) {
		ingSearches[idx].query = query;
		clearTimeout(searchTimers[idx]);
		if (!query.trim()) { ingSearches[idx].results = []; return; }
		searchTimers[idx] = setTimeout(async () => {
			ingSearches[idx].loading = true;
			try {
				const params = new URLSearchParams({ q: query, limit: '20' });
				const res = await fetch(resolve('/recipies/api/items') + '?' + params);
				if (res.ok) {
					const { items } = await res.json();
					ingSearches[idx].results = items;
				}
			} finally {
				ingSearches[idx].loading = false;
			}
		}, 250);
	}

	function selectIngredientItem(idx: number, item: SearchItem) {
		form.ingredients[idx].item_id = item.id;
		const update: Record<number, SearchItem> = { ...resolvedItems };
		update[item.id] = item;
		resolvedItems = update;
		ingSearches[idx].searching = false;
		ingSearches[idx].query = '';
		ingSearches[idx].results = [];
		isDirty = true;
	}

	function startSearching(idx: number) {
		ingSearches[idx].searching = true;
		ingSearches[idx].query = '';
		ingSearches[idx].results = [];
	}

	function addIngredient() {
		form.ingredients = [...form.ingredients, { item_id: 0, count: 1 }];
		ingSearches = [...ingSearches, { searching: true, query: '', results: [], loading: false }];
		isDirty = true;
	}

	function removeIngredient(i: number) {
		form.ingredients = form.ingredients.filter((_, j) => j !== i);
		ingSearches = ingSearches.filter((_, j) => j !== i);
		isDirty = true;
	}

	let wikiLoading = $state(false);
	let wikiError = $state('');
	let saveStatus = $state<'' | 'saving' | 'saved' | 'error'>('');

	async function fetchFromWiki() {
		wikiLoading = true;
		wikiError = '';
		try {
			const res = await fetch(resolve(`/recipies/api/wiki/${data.id}`));
			if (!res.ok) {
				const err = await res.json().catch(() => ({ error: 'Unknown error' }));
				wikiError = err.error ?? `HTTP ${res.status}`;
				return;
			}
			const wikiData = await res.json();
			if (wikiData.recipe) {
			// wiki block uses camelCase: outputCount, outputItemId, disciplines, recipeType
			form.output_item_count = wikiData.recipe.outputCount ?? wikiData.recipe.output_item_count ?? 1;
			if (Array.isArray(wikiData.recipe.disciplines) && wikiData.recipe.disciplines.length > 0) {
				form.disciplines = wikiData.recipe.disciplines;
			}
			if (wikiData.recipe.recipeType && RECIPE_TYPES.includes(wikiData.recipe.recipeType)) {
				form.type = wikiData.recipe.recipeType;
			}
				// Resolve each ingredient name → item_id via items API
				const rawIngs: { name?: string; item_id?: number; count?: number }[] = wikiData.recipe.ingredients ?? [];
				const resolvedIngs: Ingredient[] = [];
				const newResolved: Record<number, SearchItem> = { ...resolvedItems };

				for (const ing of rawIngs) {
					const count = ing.count ?? 1;
					if (ing.item_id && ing.item_id > 0) {
						resolvedIngs.push({ item_id: ing.item_id, count });
						continue;
					}
					if (ing.name) {
						const params = new URLSearchParams({ q: ing.name, limit: '10' });
						const itemRes = await fetch(resolve('/recipies/api/items') + '?' + params).catch(() => null);
						if (itemRes?.ok) {
							const { items } = await itemRes.json();
							const exact = (items as SearchItem[]).find(it => it.name.toLowerCase() === ing.name!.toLowerCase());
							const best = exact ?? (items as SearchItem[])[0];
							if (best) {
								resolvedIngs.push({ item_id: best.id, count });
								newResolved[best.id] = best;
								continue;
							}
						}
					}
					resolvedIngs.push({ item_id: 0, count });
				}

				// Only replace ingredients if wiki actually found some
				if (resolvedIngs.length > 0) {
					form.ingredients = resolvedIngs;
					resolvedItems = newResolved;
				}
				// reset per-ingredient search states
				if (resolvedIngs.length > 0) {
					ingSearches = resolvedIngs.map(() => ({ searching: false, query: '', results: [], loading: false }));
				}
			}
			if (wikiData.acquisition) {
				form.acquisition = wikiData.acquisition;
				// Replace wiki thumbnail icon_urls with GW2 API icons from our items cache
				const allCosts = (form.acquisition?.vendors ?? []).flatMap(v => v.cost).filter(c => c.item_name);
				const uniqueNames = [...new Set(allCosts.map(c => c.item_name))];
				for (const name of uniqueNames) {
					try {
						const params = new URLSearchParams({ q: name, limit: '5' });
						const itemRes = await fetch(resolve('/recipies/api/items') + '?' + params);
						if (itemRes.ok) {
							const { items } = await itemRes.json();
							const exact = (items as SearchItem[]).find(it => it.name.toLowerCase() === name.toLowerCase());
							if (exact?.icon) {
								for (const cost of allCosts) {
									if (cost.item_name === name) cost.icon_url = exact.icon;
								}
							}
						}
					} catch {}
				}
			}
			isDirty = true;
		} finally {
			wikiLoading = false;
		}
	}

	async function save() {
		saveStatus = 'saving';
		try {
			const payload = [{
				id: 0,
				type: form.type,
				output_item_id: form.output_item_id,
				output_item_count: form.output_item_count,
				time_to_craft_ms: form.time_to_craft_ms,
				disciplines: form.disciplines,
				min_rating: form.min_rating,
				flags: form.flags,
				ingredients: form.ingredients,
				...(form.acquisition ? { acquisition: form.acquisition } : {})
			}];
			const res = await fetch(resolve(`/recipies/api/recipe/${data.id}`), {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload)
			});
			saveStatus = res.ok ? 'saved' : 'error';
			if (saveStatus === 'saved') {
				isDirty = false;
				setTimeout(() => { saveStatus = ''; }, 3000);
			}
		} catch {
			saveStatus = 'error';
		}
	}

	const DISCIPLINES = ['Artificer','Armorsmith','Chef','Huntsman','Jeweler','Leatherworker','Mystic Forge','Scribe','Tailor','Weaponsmith'];
	const RECIPE_TYPES = [
		'Amulet','Axe','Backpack','Bag','Boots','Bulk','Coat','Component','Consumable',
		'Dagger','Dessert','Dye','Earring','Feast','Focus','Food','GuildConsumable',
		'GuildConsumableWvw','GuildDecoration','Gloves','Greatsword','Hammer','Harpoon',
		'Helm','IngredientCooking','Inscription','Insignia','Leggings','LegendaryComponent',
		'LongBow','Mace','Meal','Pistol','Potion','Refinement','RefinementEctoplasm',
		'RefinementObsidian','Rifle','Ring','Scepter','Seasoning','Shield','ShortBow',
		'Shoulders','Snack','Soup','Speargun','Staff','Sword','Torch','Trident','Trophy',
		'UpgradeComponent','Warhorn',
	].sort((a, b) => a.localeCompare(b));
</script>

<div class="recipe-editor">
	{#if stackIds.length > 0}
		<nav class="breadcrumb">
			<a href={resolve('/recipies') + (data.back ?? '')}>All items</a>
			{#each stackIds as parentId, i (parentId)}
				<span>›</span>
				<a href={resolve(`/recipies/${parentId}${i > 0 ? `?stack=${stackIds.slice(0, i).join(',')}` : ''}`)}>
					{data.stackItems?.[parentId] ?? `#${parentId}`}
				</a>
			{/each}
			<span>›</span>
			<span>{data.outputItem?.name ?? `#${data.id}`}</span>
		</nav>
	{:else}
		<nav class="breadcrumb">
			<a href={resolve('/recipies') + (data.back ?? '')}>All items</a>
			<span>›</span>
			<span>{data.outputItem?.name ?? `#${data.id}`}</span>
		</nav>
	{/if}

	<h1>Recipe #{data.id}</h1>

	<!-- Output item hero -->
	{#if data.outputItem}
		<div class="output-hero">
			{#if data.outputItem.icon}<img src={data.outputItem.icon} alt="" class="output-icon" />{/if}
			<div class="output-info">
				<span class="output-name {data.outputItem.rarity ? `rarity-${data.outputItem.rarity.toLowerCase()}` : ''}">
					{data.outputItem.name}
				</span>
				<span class="output-rarity">{data.outputItem.rarity}{#if data.outputItem.type} · {data.outputItem.type}{/if}</span>
			</div>
			{#if form.output_item_count > 1}
				<span class="output-count">×{form.output_item_count}</span>
			{/if}
		</div>
	{/if}

	<!-- API-only: read-only summary + create custom button -->
	{#if isApiOnly && !editMode}
		<div class="api-notice">
			<span class="api-badge">GW2 API</span>
			<span>This recipe comes from the GW2 API and cannot be edited.</span>
			<button class="btn-create-custom" onclick={() => { editMode = true; }}>+ Create custom override</button>
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
							{@const resolved = resolvedItems[ing.item_id ?? ing.id]}
							<div class="api-ing-row">
								<span class="ing-count-label">{ing.count}×</span>
								{#if resolved?.icon}<img src={resolved.icon} alt="" class="ing-icon-sm" />{/if}
							<span class={resolved?.rarity ? `rarity-${resolved.rarity.toLowerCase()}` : ''}>{resolved?.name ?? `#${ing.item_id ?? ing.id}`}</span>
							</div>
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	{:else}
	<!-- Editor -->
	<div class="editor-columns">
	<div class="editor-left">
	<div class="wiki-section">
		<button onclick={fetchFromWiki} disabled={wikiLoading} class="btn-wiki">
			{wikiLoading ? 'Fetching...' : 'Fetch from Wiki'}
		</button>
		{#if wikiError}<span class="error">{wikiError}</span>{/if}
	</div>

	<div class="field-row">
		<label>Type:
			<select bind:value={form.type}>
				{#each RECIPE_TYPES as t (t)}
					<option value={t}>{t}</option>
				{/each}
			</select>
		</label>
		<label>Output count: <input type="number" bind:value={form.output_item_count} /></label>
		<label>Min rating: <input type="number" bind:value={form.min_rating} /></label>
	</div>

	<div class="field-group">
		<span>Disciplines:</span>
		{#each DISCIPLINES as disc (disc)}
			<label>
				<input type="checkbox"
					checked={form.disciplines.includes(disc)}
					onchange={(e) => {
						if (e.currentTarget.checked) form.disciplines = [...form.disciplines, disc];
						else form.disciplines = form.disciplines.filter(d => d !== disc);
					}}
				/> {disc}
			</label>
		{/each}
	</div>

	<div class="section">
		<h2>Ingredients</h2>
		{#each form.ingredients as ing, i (i)}
			{@const search = ingSearches[i]}
			{@const resolved = resolvedItems[ing.item_id]}
			<div class="ingredient-row">
				<input type="number" bind:value={ing.count} placeholder="Count" class="ing-count" min="1" />
				<div class="ing-item">
					{#if search?.searching || ing.item_id === 0}
						<div class="ing-search-wrap">
							<input
								class="ing-search-input"
								placeholder="Search item name..."
								value={search?.query ?? ''}
								oninput={(e) => searchItems(i, e.currentTarget.value)}
								onblur={() => setTimeout(() => { if (ingSearches[i]) ingSearches[i].results = []; }, 200)}
								autofocus
							/>
							{#if search?.loading}<span class="ing-searching">…</span>{/if}
							{#if search?.results.length}
								<ul class="ing-dropdown">
									{#each search.results as item (item.id)}
										<li onmousedown={() => selectIngredientItem(i, item)}>
											{#if item.icon}<img src={item.icon} alt="" class="ing-icon-sm" />{/if}
									<span class={item.rarity ? `rarity-${item.rarity.toLowerCase()}` : ''}>{item.name}</span>
											<span class="ing-id-hint">#{item.id}</span>
										</li>
									{/each}
								</ul>
							{/if}
						</div>
					{:else}
						<div class="ing-resolved">
							{#if resolved?.icon}<img src={resolved.icon} alt="" class="ing-icon-sm" />{/if}
								<span class="ing-name {resolved?.rarity ? `rarity-${resolved.rarity.toLowerCase()}` : ''}">
								{resolved?.name ?? `#${ing.item_id}`}
							</span>
							<button class="btn-change" onclick={() => startSearching(i)} title="Change item">✎</button>
						</div>
					{/if}
				</div>
				<a href={resolve(`/recipies/${ing.item_id}?stack=${[...stackIds, data.id].join(',')}`)}
				   class="btn-drill" title="Drill down">↳</a>
				<button onclick={() => removeIngredient(i)} class="btn-remove">✕</button>
			</div>
		{/each}
		<button onclick={addIngredient} class="btn-add">+ Add ingredient</button>
	</div>

	<div class="section">
		<h2>Acquisition (Vendors)</h2>
		{#if !form.acquisition}
			<button onclick={() => { form.acquisition = { vendors: [] }; }} class="btn-add">+ Add acquisition</button>
		{:else}
			{#each form.acquisition.vendors as vendor, vi (vi)}
				<div class="vendor-block">
					<div class="vendor-header">
						<input bind:value={vendor.name} placeholder="Vendor name" class="vendor-name" />
						<button onclick={() => { form.acquisition!.vendors = form.acquisition!.vendors.filter((_, j) => j !== vi); }} class="btn-remove">✕</button>
					</div>
					{#if !vendor.cost?.length}
					<div class="vendor-field">
						<label>Gold cost (copper):
							<span class="gold-cost-row">
								<input type="number" bind:value={vendor.gold_cost} />
								{#if vendor.gold_cost}<Price value={vendor.gold_cost} />{/if}
							</span>
						</label>
					</div>
					{/if}
					{#each vendor.cost as cost, ci (ci)}
						<div class="cost-row">
							<input type="number" bind:value={cost.amount} placeholder="Amount" class="cost-amount" />
							{#if cost.icon_url}<img src={cost.icon_url} alt={cost.item_name} class="cost-icon-preview" />{/if}
							<input bind:value={cost.item_name} placeholder="Currency name" class="cost-name" />
							<input bind:value={cost.icon_url} placeholder="Icon URL" class="cost-icon" />
							<button onclick={() => { vendor.cost = vendor.cost.filter((_, j) => j !== ci); }} class="btn-remove">✕</button>
						</div>
					{/each}
					<button onclick={() => { vendor.cost = [...vendor.cost, { amount: 0, item_name: '', icon_url: '' }]; }} class="btn-add">+ Add cost</button>
				</div>
			{/each}
			<button onclick={() => { form.acquisition!.vendors = [...form.acquisition!.vendors, { name: '', cost: [], gold_cost: 0 }]; }} class="btn-add">+ Add vendor</button>
		{/if}
	</div>

	<div class="save-section">
		<button onclick={save} disabled={saveStatus === 'saving'} class="btn-save">
			{saveStatus === 'saving' ? 'Saving...' : 'Save Recipe'}
		</button>
		{#if saveStatus === 'saved'}<span class="success">Saved!</span>{/if}
		{#if saveStatus === 'error'}<span class="error">Save failed</span>{/if}
	</div>
	</div><!-- /editor-left -->
	<div class="editor-right">
		<iframe
			src="https://wiki.guildwars2.com/wiki/{encodeURIComponent(data.outputItem?.name ?? String(data.id))}"
			title="GW2 Wiki"
			class="wiki-iframe"
			sandbox="allow-scripts allow-same-origin"
		></iframe>
	</div><!-- /editor-right -->
	</div><!-- /editor-columns -->
	{/if}
</div>

<style>
	.recipe-editor { max-width: 1600px; margin: 0 auto; padding: 1rem; }
	.editor-columns { display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; align-items: start; }
	.editor-left { min-width: 0; }
	.editor-right { position: sticky; top: 1rem; height: calc(100vh - 2rem); }
	.wiki-iframe { width: 100%; height: 100%; border: 1px solid #333; border-radius: 4px; background: #fff; }
	.breadcrumb { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 1rem; font-size: 0.9rem; }
	.breadcrumb a { color: #80c4ff; text-decoration: none; }
	.breadcrumb a:hover { text-decoration: underline; }
	.output-hero { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; padding: 0.75rem 1rem; background: #1a1a2a; border: 1px solid #333; border-radius: 6px; }
	.output-icon { width: 48px; height: 48px; object-fit: contain; }
	.output-info { display: flex; flex-direction: column; }
	.output-name { font-size: 1.15rem; font-weight: bold; }
	.output-rarity { font-size: 0.8rem; color: #888; }
	.output-count { font-size: 1.1rem; color: #ccc; margin-left: auto; }
	.api-notice { display: flex; align-items: center; gap: 0.75rem; padding: 0.6rem 1rem; background: #1a1a1a; border: 1px solid #444; border-radius: 4px; margin-bottom: 1rem; font-size: 0.9rem; color: #aaa; flex-wrap: wrap; }
	.api-badge { background: #2a3a5a; color: #80aaff; padding: 0.15rem 0.5rem; border-radius: 3px; font-size: 0.75rem; font-weight: bold; }
	.btn-create-custom { margin-left: auto; padding: 0.3rem 0.75rem; background: #1a3a1a; color: #80ff80; border: 1px solid #2a5a2a; border-radius: 3px; cursor: pointer; font-size: 0.85rem; }
	.api-recipe-block { border: 1px solid #2a2a3a; border-radius: 4px; padding: 0.75rem; margin-bottom: 0.75rem; background: #111; }
	.api-recipe-meta { display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 0.5rem; }
	.meta-pill { background: #1e2a1e; color: #8ac; padding: 0.1rem 0.45rem; border-radius: 3px; font-size: 0.78rem; }
	.api-ings { display: flex; flex-direction: column; gap: 0.25rem; }
	.api-ing-row { display: flex; align-items: center; gap: 0.4rem; font-size: 0.9rem; }
	.ing-count-label { color: #aaa; min-width: 2rem; text-align: right; }
	.wiki-section { margin-bottom: 1.5rem; display: flex; align-items: center; gap: 1rem; }
	.btn-wiki { padding: 0.4rem 1rem; background: #2a3a6a; color: #aac4ff; border: 1px solid #4a6aaa; border-radius: 4px; cursor: pointer; }
	.field-row { display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1rem; }
	.field-row label { display: flex; flex-direction: column; gap: 0.25rem; font-size: 0.9rem; }
	.field-row input, .field-row select { padding: 0.3rem; background: #1a1a1a; border: 1px solid #444; color: #fff; border-radius: 3px; width: 100px; }
	.field-row select { width: auto; min-width: 160px; }
	.field-group { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; align-items: center; }
	.field-group label { display: flex; align-items: center; gap: 0.25rem; font-size: 0.85rem; }
	.section { margin-bottom: 2rem; }
	.section h2 { font-size: 1rem; color: #aaa; margin-bottom: 0.5rem; border-bottom: 1px solid #333; padding-bottom: 0.25rem; }
	.ingredient-row { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.35rem; background: var(--gw2helper-module); border-radius: 4px; padding: 0.25rem 0.4rem; }
	.ing-item { flex: 1; min-width: 0; position: relative; }
	.ing-search-wrap { position: relative; }
	.ing-search-input { width: 100%; padding: 0.3rem; background: #1a1a1a; border: 1px solid #555; color: #fff; border-radius: 3px; }
	.ing-searching { position: absolute; right: 6px; top: 50%; transform: translateY(-50%); color: #888; }
	.ing-dropdown { position: absolute; top: 100%; left: 0; right: 0; z-index: 100; background: #1e1e1e; border: 1px solid #555; border-radius: 3px; margin: 0; padding: 0; list-style: none; max-height: 220px; overflow-y: auto; }
	.ing-dropdown li { display: flex; align-items: center; gap: 0.4rem; padding: 0.3rem 0.5rem; cursor: pointer; }
	.ing-dropdown li:hover { background: #2a2a2a; }
	.ing-icon-sm { width: 20px; height: 20px; object-fit: contain; flex-shrink: 0; }
	.ing-id-hint { color: #666; font-size: 0.75rem; margin-left: auto; }
	.ing-resolved { display: flex; align-items: center; gap: 0.4rem; padding: 0.25rem 0; }
	.ing-name { flex: 1; font-size: 0.9rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.btn-change { background: none; border: none; color: #888; cursor: pointer; font-size: 0.9rem; padding: 0 0.25rem; }
	.btn-change:hover { color: #ccc; }
	.ing-count { width: 60px; }
	input { padding: 0.3rem; background: #1a1a1a; border: 1px solid #444; color: #fff; border-radius: 3px; }
	.btn-drill { color: #80c4ff; text-decoration: none; font-size: 1.1rem; padding: 0 0.3rem; }
	.btn-remove { background: #4a1a1a; color: #ff8080; border: none; border-radius: 3px; cursor: pointer; padding: 0.2rem 0.5rem; }
	.btn-add { background: #1a3a1a; color: #80ff80; border: 1px solid #2a5a2a; border-radius: 3px; cursor: pointer; padding: 0.3rem 0.7rem; font-size: 0.85rem; margin-top: 0.25rem; }
	.vendor-block { border: 1px solid #333; border-radius: 4px; padding: 0.75rem; margin-bottom: 0.75rem; }
	.vendor-header { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 0.5rem; }
	.vendor-name { flex: 1; }
	.vendor-field { margin-bottom: 0.5rem; font-size: 0.85rem; }
	.gold-cost-row { display: inline-flex; align-items: center; gap: 0.5rem; }
	.cost-row { display: flex; gap: 0.5rem; margin-bottom: 0.35rem; align-items: center; }
	.cost-amount { width: 70px; }
	.cost-name { flex: 1; }
	.cost-icon { flex: 2; }
	.cost-icon-preview { width: 20px; height: 20px; object-fit: contain; flex-shrink: 0; }
	.save-section { display: flex; align-items: center; gap: 1rem; margin-top: 1rem; }
	.btn-save { padding: 0.5rem 1.5rem; background: #1a5a1a; color: #80ff80; border: 1px solid #2a8a2a; border-radius: 4px; cursor: pointer; font-size: 1rem; }
	.success { color: #80ff80; }
	.error { color: #ff8080; }
</style>
