<script lang="ts">
	import Item from '$lib/components/item.svelte';

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

	function match(word: string, obj: object, properties: Array<string>) {
		// at least one property has to match
		return properties.some((x) => {
			if (obj['count'] != undefined && ['>', '<'].includes(word.charAt(0))) {
				if (word.startsWith('>')) {
					return obj.count ? obj.count > parseInt(word.slice(1)) : false;
				}
				if (word.startsWith('>=')) {
					return obj.count ? obj.count >= parseInt(word.slice(2)) : false;
				}
				if (word.startsWith('<')) {
					return obj.count ? obj.count < parseInt(word.slice(1)) : false;
				}
				if (word.startsWith('<=')) {
					return obj.count ? obj.count <= parseInt(word.slice(2)) : false;
				}
			} else {
				if (typeof obj[x] === 'string' && obj[x].toLowerCase().includes(word)) {
					return true;
				}
			}
			return false;
		});
	}

	function fullTextSearch(filter: string, obj: object, properties: Array<string>) {
		if (!filter) return true;
		const f = filter.toLowerCase();

		const words = f.split(' ');
		// all words have to be found somewhere
		return words.every((x) => match(x, obj, properties));
	}

	function filterCollection(collection, filter, sortBy) {
		let filtered = collection.filter((x) => {
			return fullTextSearch(filter, x, ['name', 'description', 'type', 'subtype', 'subdescr', 'rarity']);
		});
		// if (sortBy == SortType.Slots) {
		// 	console.log('sorting by slots...');
		// 	let map = filtered.reduce(function (acc, curr) {
		// 		acc[curr.id] = (acc[curr.id] || 0) + 1;
		// 		return acc;
		// 	}, {});
		// 	console.log('map', map);

		// 	const countBySlots = Object.keys(map).sort(function (a, b) {
		// 		return map[b] - map[a];
		// 	});
		// 	/// TODO: mapping filtered by countBySlots
		// } else {
		// 	console.log('not sorting...');
		// }
		document.body.querySelectorAll('details').forEach((e) => {
			e.setAttribute('open', true);
		});
		return filtered;
	}
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

<details open>
	<summary>Bank</summary>
	<article>
		<div class="items">
			{#each filterCollection(data.bank, filter, sortBy) as item}
				<Item {item} />
			{/each}
		</div>
	</article>
</details>

<details open>
	<summary>Shared inventory</summary>
	<article>
		<div class="items">
			{#each filterCollection(data.shared, filter, sortBy) as item}
				<Item {item} />
			{/each}
		</div>
	</article>
</details>

<h2>Characters' items</h2>
{#each data.characters as char}
	<details open>
		<summary>{char.name}</summary>
		<article>
			<div class="items">
				{#each filterCollection(char._items, filter, sortBy) as item}
					<Item {item} />
				{/each}
			</div>
		</article>
	</details>
{/each}

<style lang="scss" global>
	details {
		margin: 1em 0;
		display: flex;
		&[open] {
			background-color: #ddd;
			padding-bottom: 1em;
		}
		p {
			margin: 0 1em;
		}
		ul {
			margin: 1em 0;
		}
		article {
			width: 100%;
			padding: 1em;
		}
	}

	summary {
		padding: 1em;
		border-radius: 5px;
		font-size: 110%;
		// font-weight: bold;
		font-family: Menomonia, 'Helvetica Neue', Helvetica, Arial, sans-serif;
	}

	.items {
		display: flex;
		flex-flow: row wrap;
		gap: 10px;
	}
</style>
