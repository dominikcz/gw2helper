<script lang="ts">
	import { onMount } from 'svelte';
	import { resolve } from '$app/paths';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import ItemLabel from '$lib/components/items/itemLabel.svelte';

	interface Item {
		id: number;
		name: string;
		icon: string | null;
		rarity: string;
		type: string;
		hasRecipe: boolean;
	}

	const PREFIXES = new Set([
		"Ahamid's","Angchu","Apostate's","Apothecary's","Assassin's","Avatar","Beigarth's","Berserker's",
		"Bringer's","Captain's","Carrion","Cavalier's","Celestial","Cleric's","Commander's","Crusader",
		"Demolisher","Deserter","Destroyer","Dire","Diviner's","Dragon's","Ferratus's","Forgemaster's",
		"Forsaken","Giftbringer's","Giver's","Gobrech's","Grieving","Harrier's","Healing","Hearty",
		"Heretic","Honed","Hronk's","Hunter","Keeper's","Knight's","Laranthir's","Leftpaw's","Lingering",
		"Magi's","Maklain's","Malign","Marauder","Marshal's","Mending","Mighty","Minstrel's","Morbach's",
		"Mystical","Nadijeh's","Nerashi's","Nomad's","Occam's","Ossa's","Pahua's","Paladin","Penetrating",
		"Plaguedoctor's","Potent","Precise","Rabid","Rampager's","Ravaging","Rejuvenating","Resilient",
		"Ritualist's","Ruka's","Sage","Saphir's","Sentinel's","Seraph","Settler's","Shaman's","Sinister",
		"Soldier's","Spiteful","Steelstar's","Stout","Strong","Survivor","Suun's","Svaard's","Swashbuckler",
		"Tateos's","Thackeray's","The Twins'","Tixx's","Tizlak's","Togo's","Trailblazer's","Tyrant",
		"Vagabond","Valkyrie","Veldrunner's","Ventari's","Verata's","Vigilant","Vigorous","Viper's",
		"Vital","Wanderer's","Wei Qi's","Wizard","Wupwup","Yassith's","Zealot's","Zehtuka's","Zintl","Zojja's"
	]);

	function getWikiSearchName(name: string, rarity: string): string {
		if (rarity === 'Legendary') return name.trim();
		let result = name.trim();
		// strip known prefix (try longest match first via sorted by length desc)
		const sorted = [...PREFIXES].sort((a, b) => b.length - a.length);
		for (const prefix of sorted) {
			if (result.startsWith(prefix + ' ')) {
				result = result.slice(prefix.length + 1).trim();
				break;
			}
		}
		// strip suffix: everything from " of " onwards
		const ofIdx = result.indexOf(' of ');
		if (ofIdx !== -1) {
			result = result.slice(0, ofIdx).trim();
		}
		return result;
	}

	let query = $state('');
	let rarity = $state('');
	let itemType = $state('');
	let items = $state<Item[]>([]);
	let loading = $state(false);
	let error = $state('');
	let debounceTimer: ReturnType<typeof setTimeout>;

	// Sync state from URL search params (restores filters on back-navigation)
	$effect(() => {
		const params = $page.url.searchParams;
		query = params.get('q') ?? '';
		rarity = params.get('rarity') ?? '';
		itemType = params.get('type') ?? '';
	});

	function updateUrl() {
		const params = new URLSearchParams();
		if (query) params.set('q', query);
		if (rarity) params.set('rarity', rarity);
		if (itemType) params.set('type', itemType);
		const search = params.toString();
		goto('?' + search, { replaceState: true, keepFocus: true, noScroll: true });
	}

	async function fetchItems() {
		loading = true;
		error = '';
		try {
			const params = new URLSearchParams({ q: query, rarity, type: itemType, limit: '1000' });
			const res = await fetch(resolve('/recipies/api/items') + '?' + params);
			if (!res.ok) throw new Error(`HTTP ${res.status}`);
			const json = await res.json();
			items = json.items;
		} catch (e) {
			error = e instanceof Error ? e.message : 'Unknown error';
		} finally {
			loading = false;
		}
	}

	$effect(() => {
		const _q = query;
		const _r = rarity;
		const _t = itemType;
		clearTimeout(debounceTimer);
		debounceTimer = setTimeout(() => {
			updateUrl();
			fetchItems();
		}, 300);
		return () => clearTimeout(debounceTimer);
	});

	onMount(() => {
		fetchItems();
	});
</script>

<div class="recipies-list-page">
	<h1>Recipe Editor</h1>

	<div class="filters">
		<input placeholder="Search items..." bind:value={query} />
		<select bind:value={rarity}>
			<option value="">All rarities</option>
			<option value="Junk">Junk</option>
			<option value="Basic">Basic</option>
			<option value="Fine">Fine</option>
			<option value="Masterwork">Masterwork</option>
			<option value="Rare">Rare</option>
			<option value="Exotic">Exotic</option>
			<option value="Ascended">Ascended</option>
			<option value="Legendary">Legendary</option>
		</select>
		<select bind:value={itemType}>
			<option value="">All types</option>
			<option value="Armor">Armor</option>
			<option value="Back">Back</option>
			<option value="Bag">Bag</option>
			<option value="Consumable">Consumable</option>
			<option value="Container">Container</option>
			<option value="CraftingMaterial">Crafting Material</option>
			<option value="Gathering">Gathering</option>
			<option value="Gizmo">Gizmo</option>
			<option value="Key">Key</option>
			<option value="MiniPet">Mini Pet</option>
			<option value="Tool">Tool</option>
			<option value="Trait">Trait</option>
			<option value="Trinket">Trinket</option>
			<option value="Trophy">Trophy</option>
			<option value="UpgradeComponent">Upgrade Component</option>
			<option value="Weapon">Weapon</option>
		</select>
	</div>

	{#if loading}<div class="loading">Loading...</div>{/if}
	{#if error}<div class="error">{error}</div>{/if}

	<div class="items-count">{items.length} items</div>

	<div class="items-grid">
		{#each items as item (item.id)}
			<div class="item-row">
				<div class="col-label">
					<ItemLabel id={item.id} name={item.name} icon={item.icon ?? undefined} rarity={item.rarity} iconSize="2.5em" />
				</div>
				<span class="col-type">{item.type}</span>
				<a href={`https://wiki.guildwars2.com/wiki/Special:Search/${encodeURIComponent(getWikiSearchName(item.name, item.rarity))}`} target="_blank" rel="noopener noreferrer" class="btn btn-wiki" title="Search on GW2 Wiki">Wiki</a>
				<a href={`https://api.guildwars2.com/v2/items/${item.id}`} target="_blank" rel="noopener noreferrer" class="btn btn-api" title="GW2 API">API</a>
				{#if item.hasRecipe}
					<span class="badge has-recipe">Has Recipe</span>
				{:else}
					<span class="badge-placeholder" aria-hidden="true"></span>
				{/if}
				<a href={resolve(`/recipies/${item.id}`) + ($page.url.search ? `?back=${encodeURIComponent($page.url.search)}` : '')} class="btn" class:btn-edit={item.hasRecipe} class:btn-create={!item.hasRecipe}>{item.hasRecipe ? 'Edit' : 'Create'}</a>
			</div>
			<span class="row-sep"></span>
		{/each}
	</div>
</div>

<style>
	.recipies-list-page { max-width: 900px; margin: 0 auto; padding: 1rem; }
	.filters { display: flex; gap: 1rem; margin-bottom: 1rem; }
	.filters input { flex: 1; padding: 0.5rem; font-size: 1rem; }
	.filters select { padding: 0.5rem; font-size: 1rem; }
	.items-count { color: #888; margin-bottom: 0.5rem; font-size: 0.85rem; }
	.items-grid {
		display: grid;
		grid-template-columns: 1fr auto auto auto auto auto;
		align-items: center;
		row-gap: 0;
		column-gap: 0.6rem;
	}
	.item-row {
		display: contents;
	}
	.item-row > * {
		padding: 0.4rem 0;
		align-self: center;
	}
	.row-sep {
		grid-column: 1 / -1;
		height: 0;
		border-bottom: 1px solid rgba(128, 128, 128, 0.25);
		padding: 0;
	}
	.col-label { min-width: 0; padding-left: 0.25em; }
	.col-label :global(.item-label) { display: flex; align-items: center; gap: 0.4rem; }
	.col-label :global(.caption) { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; min-width: 0; }
	.col-type { color: #888; font-size: 0.8rem; white-space: nowrap; }
	.badge.has-recipe { background: #2d5a27; color: #8cff80; padding: 0.15rem 0.4rem; border-radius: 3px; font-size: 0.75rem; white-space: nowrap; }
	.badge-placeholder { display: inline-block; min-width: 5.5rem; }
	.btn {
		padding: 0.25rem 0.6rem;
		border-radius: 3px;
		text-decoration: none;
		font-size: 0.85rem;
		white-space: nowrap;
		text-align: center;
		border: 1px solid transparent;
	}
	/* light mode — solid backgrounds, dark text */
	.btn-wiki   { background: #c8e6c9; color: #1b5e20; border-color: #81c784; }
	.btn-api    { background: #bbdefb; color: #0d47a1; border-color: #64b5f6; }
	.btn-edit   { background: #bbdefb; color: #0d47a1; border-color: #64b5f6; min-width: 3.6rem; }
	.btn-create { background: #ffe0b2; color: #bf360c; border-color: #ffb74d; min-width: 3.6rem; }
	@media (prefers-color-scheme: dark) {
		.btn-wiki   { background: #1a3a1a; color: #80ff80; border-color: #4a8a4a; }
		.btn-api    { background: #1a1a3a; color: #80c0ff; border-color: #4a6ab0; }
		.btn-edit   { background: #1a3a6a; color: #80c4ff; border-color: #4a7ab0; }
		.btn-create { background: #3a2a0a; color: #ffcc80; border-color: #8a6a30; }
	}
</style>
