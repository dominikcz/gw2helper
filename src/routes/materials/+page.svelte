<script>
	export let data;
	import ItemsList from '$lib/components/itemsList.svelte';
	import SearchInput from '$lib/components/searchInput.svelte';
	let filter = '';

</script>

<section>
	<label for="filter">Search:</label>
	<SearchInput bind:value={filter} name="filter" id="filter" placeholder="what you are looking for?" />
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

<ItemsList summary="Materials" items={data.materials} {filter} />
