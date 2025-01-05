<script lang="ts">
	import { autotooltip } from '$lib/actions/autotooltip.js';
	import { dragHandleZone } from 'svelte-dnd-action';
	import { flip } from 'svelte/animate';
	import helperUtils from '$lib/utils/helper-utils';
	import Currency from './currency.svelte';

	interface Props {
		items?: any;
		onWalletReorder?: CallableFunction;
	}

	let { items = $bindable([]), onWalletReorder = () => {} }: Props = $props();

	const flipDurationMs = 200;

	function handleSort(e) {
		items = e.detail.items;
		const order = items.map((x) => x.id);
		onWalletReorder({
			order,
		});
	}
</script>

<section class="wallet autotooltip" use:autotooltip use:dragHandleZone={{ items, flipDurationMs }} onconsider={handleSort} onfinalize={handleSort}>
	{#each items as currency (currency.id)}
		<a href={helperUtils.wikiLink(currency.name)} target="_blank" class="autotooltip" animate:flip={{ duration: flipDurationMs }}>
			<Currency {currency} />
		</a>
	{/each}
</section>

<style lang="scss">
	.wallet {
		max-width: 37.5em;
		display: flex;
		flex-flow: column nowrap;
		gap: 0.2em;
		a {
			text-decoration: none;
		}
	}
</style>
