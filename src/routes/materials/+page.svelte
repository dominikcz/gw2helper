<script>
	export let data;
	import ItemsList from '$lib/components/items/itemsList.svelte';
	import SearchHelp from '$lib/components/searchHelp.svelte';
	import SearchInput from '$lib/components/searchInput.svelte';
	let filter = '';
</script>

<h1>Materials</h1>

<SearchInput bind:value={filter} name="filter" id="filter" placeholder="too much data?">
	<SearchHelp />
</SearchInput>

<ItemsList summary="Materials" items={data.materials} {filter} />
