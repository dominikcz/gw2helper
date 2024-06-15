<script>
	export let data;
	import Item from '$lib/components/item.svelte';
	import helperUtils from '$lib/utils/helper-utils.ts';
	let filter = '';
	let timer;

	const debounceFilter = (e) => {
		clearTimeout(timer);
		timer = setTimeout(() => (filter = e.target.value), 300);
	};

</script>

<section>
	<label for="filter">Search:</label>
	<input type="text" name="filter" id="filter" placeholder="what you are looking for?" value={filter} on:input={debounceFilter} />
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

<details open>
	<summary>Materials</summary>
	<article>
		<div class="items">
			{#each helperUtils.filterCollection(data.materials, filter) as item}
				<Item {item} />
			{/each}
		</div>
	</article>
</details>
