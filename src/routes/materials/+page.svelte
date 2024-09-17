<script>
	export let data;
	import ItemsList from '$lib/components/items/itemsList.svelte';
	import SearchHelp from '$lib/components/searchHelp.svelte';
	import SearchInput from '$lib/components/searchInput.svelte';
	import { _ } from 'svelte-i18n';

	let filter = '';
</script>

<h1>{$_('materials.materials')}</h1>

<SearchInput bind:value={filter} name="filter" id="filter" placeholder={$_('common.too_much_data')}>
	<SearchHelp />
</SearchInput>

<ItemsList summary="Materials" items={data.materials} {filter} />
