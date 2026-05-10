<script lang="ts">
	import Awaiter from '$lib/components/ui/awaiter.svelte';
	import SearchInput from '$lib/components/search/searchInput.svelte';
	import helperUtils from '$lib/utils/helper-utils';
	import { t as _ } from '$lib/services/i18n';
	import CharacterCard from '$lib/components/characters/characterCard.svelte';
	import type { PageData } from './$types';
	import type { ApiCharacterDto } from '$lib/types/gw2-api';

	let { data }: { data: PageData } = $props();
	let filter = $state('');
	const fields = ['name', 'race', 'gender', 'profession', 'level', 'title', 'crafting_discipline'];

	type Character = ApiCharacterDto;
</script>

<h1>{$_('characters.characters')}</h1>
<SearchInput bind:value={filter} name="filter" id="filter" placeholder={$_('common.what_are_you_looking_for')} />

<Awaiter promise={data.characters}>
	{#snippet children(result: Character[])}
		{@const filtered = helperUtils.filterCollection(result as unknown as Record<string, unknown>[], fields, filter) as unknown as Character[]}
		{#each filtered.sort((a, b) => -1 * ((Number(a.age || 0)) - (Number(b.age || 0)))) as char}
			<CharacterCard {char} />
		{/each}
	{/snippet}
</Awaiter>

