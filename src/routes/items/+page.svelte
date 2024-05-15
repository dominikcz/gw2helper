<script lang="ts">
	export let data;
	console.log('data', data);
	let filter = '';

	function match(word: string, obj: object, properties: Array<string>) {
		// at least one property has to match
		return properties.some((x) => {
			if (typeof obj[x] === 'string' && obj[x].toLowerCase().includes(word)) {
				return true;
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

	function filterCharItems(char, filter) {
		console.log('filterCharItems', { char, filter });
		return char._items.filter((x) => {
			return fullTextSearch(filter, x, ['name', 'description', 'type', 'rarity']);
		});
	}

	$: filteredBank = data.bank.filter((x) => {
		return fullTextSearch(filter, x, ['name', 'description', 'type', 'rarity']);
	});
</script>

<h1>Items</h1>

<section>
	<label for="filter">Search:</label>
	<input type="text" name="filter" id="filter" placeholder="what you are looking for?" bind:value={filter} />
</section>

<details open>
	<summary>Bank</summary>
	<article>
		<div class="items">
			{#each filteredBank as item}
				<img class="rarity-{item.rarity.toLowerCase()}" alt={item.name} title={item.name} src={item.icon} />
			{/each}
		</div>
	</article>
</details>

<h2>Characters</h2>
{#each data.characters as char}
	<details open>
		<summary>{char.name}</summary>
		<article>
			<div class="items">
				{#each filterCharItems(char, filter) as item}
					<img class="rarity-{item.rarity.toLowerCase()}" alt={item.name} title={item.name} src={item.icon} />
				{/each}
			</div>
		</article>
	</details>
{/each}

<style lang="scss" global>
	details {
		margin: 1em 0;
		background-color: #aaa;
		display: flex;
		&[open] {
			background-color: #ddd;
		}
		article {
			width: 100%;
			padding: 1em;
		}
	}

	summary {
		padding: 1em;
		border-radius: 5px;
	}

	.items {
		display: flex;
		flex-flow: row wrap;
		gap: 10px;
		img {
			width: 60px;
			height: 60px;
			outline-width: 3px;
			outline-style: solid;
		}
	}
</style>
