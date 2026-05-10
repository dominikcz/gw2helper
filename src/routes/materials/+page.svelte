<script lang="ts">
	import ItemsList from '$lib/components/items/itemsList.svelte';
	import SearchHelp from '$lib/components/searchHelp.svelte';
	import SearchInput from '$lib/components/searchInput.svelte';
	import { t as _ } from '$lib/services/i18n';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let filter = $state('');
</script>

<h1>{$_('materials.materials')}</h1>

<SearchInput bind:value={filter} name="filter" id="filter" placeholder={$_('common.too_much_data')}>
	<SearchHelp />
</SearchInput>

<ItemsList summary={$_('materials.materials')} items={data.materials} {filter} />
