<script lang="ts">
	import ItemsList from '$lib/components/items/itemsList.svelte';
	import Awaiter from '$lib/components/awaiter.svelte';
	import SearchInput from '$lib/components/searchInput.svelte';
	import SearchHelp from '$lib/components/searchHelp.svelte';
	import { _ } from '$lib/localizer.js';
	import { lang } from '$lib/stores/lang.js';

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

<h1>{ _($lang, 'items.items') }</h1>

<SearchInput bind:value={filter} name="filter" id="filter" placeholder="{ _($lang, 'common.too_much_data') }">
	<!-- <button on:click={sortAsIs}>original sort order</button>
		<button on:click={sortBySlots}>sort by quantity</button> -->
	<SearchHelp />
</SearchInput>

<h3>{ _($lang, 'items.common_items') }</h3>

<ItemsList summary={ _($lang, 'items.bank') } items={data.bank} {filter} />
<ItemsList summary={ _($lang, 'items.shared_inventory') } items={data.shared} {filter} />

<h3>{ _($lang, 'items.guild_items') }</h3>
<Awaiter promise={data.guildItems} let:result>
	{#each result as guild}
		<ItemsList summary={guild.name} items={guild.stash} {filter} />
	{/each}
</Awaiter>

<h3>{ _($lang, 'items.characters_items') }</h3>
<Awaiter promise={data.characterItems} let:result>
	{#each result as char}
		<ItemsList summary={char.name} items={char._items} {filter} />
	{/each}
</Awaiter>
