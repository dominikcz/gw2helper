<script lang="ts">
	import ItemsList from '$lib/components/items/itemsList.svelte';
	import Awaiter from '$lib/components/awaiter.svelte';
	import SearchInput from '$lib/components/searchInput.svelte';
	import SearchHelp from '$lib/components/searchHelp.svelte';
	import { t as _ } from '$lib/services/i18n';
	import { sum } from '$lib/utils';
	import InventoryCleanupAdvice from '$lib/components/inventoryCleanupAdvice/inventoryCleanupAdvice.svelte';
	import type { PageData } from './$types';
	import type { ApiCharacterBagDto, CharacterWithItems, GuildStashData } from '$lib/types/gw2-api';

	interface Props {
		data: PageData;
	}

	let { data }: Props = $props();

	let filter = $state('');
	let filterFlags = $state(false);

	type Bag = ApiCharacterBagDto | null;
	type CleanupInventoryItem = {
		rarity: string;
		id: number;
		name: string;
		icon: string;
		count: number;
		type: string;
		binding?: string;
		equipped?: boolean;
		details?: {
			type?: string;
		};
	};
	type CleanupCharacterItems = {
		name: string;
		_items: CleanupInventoryItem[];
	};

	enum SortType {
		AsIs,
		Slots,
	}
	let sortBy: SortType = SortType.AsIs;

	function sortAsIs() {
		sortBy = SortType.AsIs;
	}

	function sortBySlots() {
		sortBy = SortType.Slots;
	}

	function sizes(bags: Array<{ size: number }>) {
		return bags.map((x: { size: number }) => x.size).join(', ');
	}

	function availableSlots(bags: Bag[]) {
		return bags
			.filter(Boolean)
			.map((x) => (x as ApiCharacterBagDto).inventory || [])
			.flat()
			.filter((x: unknown | null) => x === null).length;
	}
</script>

<h1>{$_('items.items')}</h1>

<SearchInput bind:value={filter} name="filter" id="filter" placeholder={$_('common.too_much_data')}>
	<!-- <button on:click={sortAsIs}>original sort order</button>
		<button on:click={sortBySlots}>sort by quantity</button> -->
	<SearchHelp />
	<label><input type="checkbox" bind:checked={filterFlags} /> search in item flags</label>
</SearchInput>

<InventoryCleanupAdvice
	bank={data.bank as unknown as Promise<CleanupInventoryItem[]>}
	shared={data.shared as unknown as Promise<CleanupInventoryItem[]>}
	charactersItems={data.charactersItems as unknown as Promise<CleanupCharacterItems[]>}
/>

<h3>{$_('items.common_items')}</h3>

<ItemsList summary={$_('items.bank')} items={data.bank as unknown as Promise<CleanupInventoryItem[]>} {filter} {filterFlags}/>
<ItemsList summary={$_('items.shared_inventory')} items={data.shared as unknown as Promise<CleanupInventoryItem[]>} {filter} {filterFlags} />

<h3>{$_('items.guild_items')}</h3>
<Awaiter promise={data.guildItems}>
	{#snippet children(result: GuildStashData[])}
		{#each result as guild}
			<ItemsList summary={guild.name} items={guild.stash} error={guild.error} {filter} {filterFlags} />
		{/each}
	{/snippet}
</Awaiter>

<h3>{$_('items.characters_items')}</h3>
<Awaiter promise={data.charactersItems}>
	{#snippet children(result: CharacterWithItems[])}
		{#each result as char}
			{@const allBags = char.bags || []}
			{@const bags = allBags.filter(Boolean) as Array<{ size: number }>}
			{@const capacity = sum(bags, 'size')}
			{@const available = availableSlots(allBags)}
			<!-- `${char.name} - ${char.bags.length} bags (${}) - ${sum(char.bags, 'size')} slots total` -->
			<ItemsList
				summary={$_('items.bags.summary', { name: char.name, available, capacity })}
				additionalInfo={$_('items.bags.details', { count: allBags.length, sizes: sizes(bags), capacity })}
				items={char._items}
				{filter}
				{filterFlags}
			/>
		{/each}
	{/snippet}
</Awaiter>
