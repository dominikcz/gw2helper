<script lang="ts">
	import ItemsList from '$lib/components/items/itemsList.svelte';
	import Awaiter from '$lib/components/awaiter.svelte';
	import SearchInput from '$lib/components/searchInput.svelte';
	import SearchHelp from '$lib/components/searchHelp.svelte';
	import { t as _ } from '$lib/services/i18n.js';
	import { sum } from '$lib/utils';
	import InventoryCleanupAdvice from '$lib/components/inventoryCleanupAdvice/inventoryCleanupAdvice.svelte';

	interface Props {
		data: any;
	}

	let { data }: Props = $props();

	let filter = $state('');
	let filterFlags = $state(false);

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

	function sizes(bags) {
		return bags.map((x) => x.size).join(', ');
	}

	function availableSlots(bags) {
		return bags
			.filter(Boolean)
			.map((x) => x.inventory)
			.flat()
			.filter((x) => x === null).length;
	}
</script>

<h1>{$_('items.items')}</h1>

<SearchInput bind:value={filter} name="filter" id="filter" placeholder={$_('common.too_much_data')}>
	<!-- <button on:click={sortAsIs}>original sort order</button>
		<button on:click={sortBySlots}>sort by quantity</button> -->
	<SearchHelp />
	<label><input type="checkbox" bind:checked={filterFlags} /> search in item flags</label>
</SearchInput>

<InventoryCleanupAdvice bank={data.bank} shared={data.shared} charactersItems={data.charactersItems} />

<h3>{$_('items.common_items')}</h3>

<ItemsList summary={$_('items.bank')} items={data.bank} {filter} {filterFlags}/>
<ItemsList summary={$_('items.shared_inventory')} items={data.shared} {filter} {filterFlags} />

<h3>{$_('items.guild_items')}</h3>
<Awaiter promise={data.guildItems}>
	{#snippet children(result)}
		{#each result as guild}
			<ItemsList summary={guild.name} items={guild.stash} error={guild.error} {filter} {filterFlags} />
		{/each}
	{/snippet}
</Awaiter>

<h3>{$_('items.characters_items')}</h3>
<Awaiter promise={data.charactersItems}>
	{#snippet children(result)}
		{#each result as char}
			{@const bags = char.bags.filter(Boolean)}
			{@const capacity = sum(bags, 'size')}
			{@const available = availableSlots(char.bags)}
			<!-- `${char.name} - ${char.bags.length} bags (${}) - ${sum(char.bags, 'size')} slots total` -->
			<ItemsList
				summary={$_('items.bags.summary', { name: char.name, available, capacity })}
				additionalInfo={$_('items.bags.details', { count: char.bags.length, sizes: sizes(bags), capacity })}
				items={char._items}
				{filter}
				{filterFlags}
			/>
		{/each}
	{/snippet}
</Awaiter>
