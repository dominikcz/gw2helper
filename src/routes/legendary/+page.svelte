<script lang="ts">
	import Awaiter from '$lib/components/awaiter.svelte';
	import SearchInput from '$lib/components/searchInput.svelte';
	import SearchHelp from '$lib/components/searchHelp.svelte';
	import { t as _ } from '$lib/services/i18n.js';

	interface Props {
		data: any;
	}

	let { data }: Props = $props();

	let filter = $state('');

	function done(items) {
		return items.some((x) => x.count);
	}
</script>

<h1>{$_('legendary.legendary')}</h1>

<SearchInput bind:value={filter} name="filter" id="filter" placeholder={$_('common.too_much_data')}>
	<!-- <button on:click={sortAsIs}>original sort order</button>
		<button on:click={sortBySlots}>sort by quantity</button> -->
	<SearchHelp />
</SearchInput>

<img src="/gw2helper/assets/150px-construction.png" title={ $_('common.under_construction') } width="150px" alt="under construction" />

<h3>{$_('legendary.armor')}</h3>

<Awaiter promise={data.legendaries}>
	{#snippet unlocksList(items)}
		<td class:done={done(items)}>
			{#each items as item}
				<img src={item.icon} alt={JSON.stringify(item)} class:locked={!item.count} />
			{/each}
		</td>
	{/snippet}

	{#snippet unlocksByWeight(weight, items)}
		<tr>
			<th>{weight}</th>
			{@render unlocksList(items.Helm)}
			{@render unlocksList(items.Shoulders)}
			{@render unlocksList(items.Coat)}
			{@render unlocksList(items.Gloves)}
			{@render unlocksList(items.Leggings)}
			{@render unlocksList(items.Boots)}
		</tr>
	{/snippet}

	{#snippet children(result)}
		<table>
			<thead>
				<tr>
					<th>Weight </th>
					<th>Helm</th>
					<th>Shoulders</th>
					<th>Coat</th>
					<th>Gloves</th>
					<th>Leggings</th>
					<th>Boots</th>
				</tr>
			</thead>
			<tbody>
				{@render unlocksByWeight('Light', result.armor.Light)}
				{@render unlocksByWeight('Medium', result.armor.Medium)}
				{@render unlocksByWeight('Heavy', result.armor.Heavy)}
			</tbody>
		</table>
	{/snippet}
</Awaiter>

<style lang="scss">
	table {
		border-collapse: collapse;
	}
	th {
		padding: 1rem;
	}
	td {
		background-color: var(--gw2helper-locked);
		padding: 0 1rem;
		&.done {
			background-color: var(--gw2helper-unlocked);
			padding: 1rem;
		}
	}
	img.locked {
		filter: grayscale(100%) opacity(50%);
	}
</style>
