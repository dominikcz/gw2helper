<script lang="ts">
	import ItemsList from '$lib/components/items/itemsList.svelte';
	import Awaiter from '$lib/components/awaiter.svelte';
	import SearchInput from '$lib/components/searchInput.svelte';
	import SearchHelp from '$lib/components/searchHelp.svelte';

	export let data;

	let filter = '';
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
</script>

<h1>Items</h1>

<SearchInput bind:value={filter} name="filter" id="filter" placeholder="too much data?">
	<!-- <button on:click={sortAsIs}>original sort order</button>
		<button on:click={sortBySlots}>sort by quantity</button> -->
	<SearchHelp />
</SearchInput>

<h3>Common items</h3>

<ItemsList summary="Bank" items={data.bank} {filter} />
<ItemsList summary="Shared inventory" items={data.shared} {filter} />

<h3>Guild items</h3>
<Awaiter promise={data.guildItems} let:result>
	{#each result as guild}
		<ItemsList summary={guild.name} items={guild.stash} {filter} />
	{/each}
</Awaiter>

<h3>Characters' items</h3>
<Awaiter promise={data.characterItems} let:result>
	{#each result as char}
		<ItemsList summary={char.name} items={char._items} {filter} />
	{/each}
</Awaiter>
