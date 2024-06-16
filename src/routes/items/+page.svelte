<script lang="ts">
	import ItemsList from '$lib/components/itemsList.svelte';
	import helperUtils from '$lib/utils/helper-utils.ts';

	export let data;
	let filter = '';
	enum SortType {
		AsIs,
		Slots,
	}
	let sortBy: SortType = SortType.AsIs;
	let timer;

	function sortAsIs() {
		sortBy = SortType.AsIs;
	}

	function sortBySlots() {
		sortBy = SortType.Slots;
	}

	const debounceFilter = (e) => {
		clearTimeout(timer);
		timer = setTimeout(() => (filter = e.target.value), 300);
	};
</script>

<section>
	<label for="filter">Search:</label>
	<input type="text" name="filter" id="filter" placeholder="what you are looking for?" value={filter} on:input={debounceFilter} />
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

<ItemsList summary="Bank" items={helperUtils.filterCollection(data.bank, filter, sortBy)} />
<ItemsList summary="Shared inventory" items={helperUtils.filterCollection(data.shared, filter, sortBy)} />

<h3>Guild items</h3>
{#each data.guilds as guild}
	<ItemsList summary={guild.name} items={helperUtils.filterCollection(guild.stash, filter, sortBy)} />
{/each}

<h3>Characters' items</h3>
{#each data.characters as char}
	<ItemsList summary={char.name} items={helperUtils.filterCollection(char._items, filter, sortBy)} />
{/each}
