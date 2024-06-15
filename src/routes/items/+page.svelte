<script lang="ts">
	import Item from '$lib/components/item.svelte';
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
	<button on:click={sortAsIs}>original sort order</button>
	<button on:click={sortBySlots}>sort by quantity</button>
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

<h1>Common items</h1>

<details class="searchable" open>
	<summary>Bank</summary>
	<article>
		<div class="items">
			{#each helperUtils.filterCollection(data.bank, filter, sortBy) as item}
				<Item {item} />
			{/each}
		</div>
	</article>
</details>

<details class="searchable" open>
	<summary>Shared inventory</summary>
	<article>
		<div class="items">
			{#each helperUtils.filterCollection(data.shared, filter, sortBy) as item}
				<Item {item} />
			{/each}
		</div>
	</article>
</details>

<h2>Guild items</h2>
{#each data.guilds as guild}
<details class="searchable" open>
	<summary>{guild.name}</summary>
	<article>
		<div class="items">
			{#each helperUtils.filterCollection(guild.stash, filter, sortBy) as item}
				<Item {item} />
			{/each}
		</div>
	</article>
</details>
{/each}

<h2>Characters' items</h2>
{#each data.characters as char}
	<details class="searchable" open>
		<summary>{char.name}</summary>
		<article>
			<div class="items">
				{#each helperUtils.filterCollection(char._items, filter, sortBy) as item}
					<Item {item} />
				{/each}
			</div>
		</article>
	</details>
{/each}

