<script>
	export let data;
	import ItemsList from '$lib/components/items/itemsList.svelte';
	import SearchHelp from '$lib/components/searchHelp.svelte';
	import SearchInput from '$lib/components/searchInput.svelte';
	import { _ } from '$lib/localizer.js';
	import { lang } from '$lib/stores/lang.js';

	let filter = '';
</script>

<h1>{_($lang, 'materials.materials')}</h1>

<SearchInput bind:value={filter} name="filter" id="filter" placeholder={_($lang, 'common.too_much_data')}>
	<SearchHelp />
</SearchInput>

<ItemsList summary={_($lang, 'materials.materials')} items={data.materials} {filter} />
