<script lang="ts">
	import ItemsList from '$lib/components/itemsList.svelte';
	import Awaiter from '$lib/components/awaiter.svelte';
	import SearchInput from '$lib/components/searchInput.svelte';

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

<section>
	<label for="filter">Search:</label>
	<SearchInput bind:value={filter} name="filter" id="filter" placeholder="what are you looking for?" />
	<!-- <button on:click={sortAsIs}>original sort order</button>
	<button on:click={sortBySlots}>sort by quantity</button> -->
	<details>
		<summary>Search help</summary>
		<p>Knock yourself out with queries like:</p>
		<ul>
			<li>ascend ring</li>
			<li>utility master condition</li>
			<li>&gt;=100</li>
			<li>&gt;10 &lt;200</li>
		</ul>
	</details>
</section>

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
