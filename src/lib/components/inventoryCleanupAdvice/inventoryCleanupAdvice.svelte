<script lang="ts">
	import { autotooltip } from '$lib/actions/autotooltip';
	import { grungeBorder } from '$lib/actions/grungeBorder';
	import Awaiter from '../awaiter.svelte';
	import { itemTooltipRenderer } from '../items/itemTooltipRenderer';
	import { t as _, t } from '$lib/services/i18n.js';
	import Item from '../items/item.svelte';
	import { sum } from '$lib/utils';

	type ItemUsage = {
		count: number;
		source: string;
	};

	type Advice = 'stack' | 'get-rid';

	type ItemAdvice = {
		item: object;
		advice: Advice;
		usage: ItemUsage[];
		savings: number;
	};

	let { bank = [], shared = [], charactersItems = [] } = $props();

	let allData = new Promise((resolve, reject) => {
		Promise.all([bank, shared, charactersItems])
			.then(([_bank, _shared, _charactersItems]) => {
				resolve(prepareAdvice(_bank, _shared, _charactersItems));
			})
			.catch((error) => reject(error));
	});

	const tooltipOptions = {
		customRenderers: {
			'img.item': itemTooltipRenderer,
		},
	};

	function minifyItem(x) {
		return {
			rarity: x.rarity,
			id: x.id,
			name: x.name,
			icon: x.icon,
			count: x.count,
			type: x.type,
			subtype: x.details && x.details.type ? x.details.type : '',
		};
	}
	function extractStackable(items, source) {
		return items
			.filter(
				(x) =>
					['CraftingMaterial', 'Consumable', 'Trophy', 'Gizmo', 'UpgradeComponent', 'Container'].includes(x.type) &&
					x.count < 250 &&
					x.binding != 'Character' &&
					!x.equipped
			)
			.map((x) => ({
				item: minifyItem(x),
				source,
			}));
	}

	function extractDustCollectors(items, source) {
		const res = items
			.filter(
				(x) =>
					(['MiniPet'].includes(x.type) && x.count < 250) ||
					(['Armor', 'Weapon'].includes(x.type) && !x.equipped) ||
					(x.type == 'Consumable' && ['Booze', 'Generic', 'Halloween', 'RandomUnlock', 'Transmutation', 'Unlock', 'Utility'].includes(x.details.type))
			)
			.map((x) => ({
				item: minifyItem(x),
				source,
			}));
		return res;
	}

	function processItems(tmp) {
		let adviceRegistry = new Map<Number, ItemAdvice>();
		tmp.forEach((x) => {
			let adv = adviceRegistry.get(x.item.id);
			if (!adv) {
				adv = {
					item: x.item,
					usage: [
						{
							count: x.item.count,
							source: x.source,
						},
					],
				};
				adviceRegistry.set(x.item.id, adv);
			} else {
				adv.usage.push({
					count: x.item.count,
					source: x.source,
				});
			}
		});
		return [...adviceRegistry.values()].filter((x) => x.usage.length > 1);
	}

	function processStackable(bank, shared, charactersItems) {
		const tmp = [];
		tmp.push(...extractStackable(bank, 'bank'));
		tmp.push(...extractStackable(shared, 'shared'));
		charactersItems.forEach((char) => {
			tmp.push(...extractStackable(char._items, char.name));
		});

		const items = processItems(tmp);
		return {
			stackSavings: stackSavings(items),
			itemsToStack: items.filter((x) => x.savings > 0),
		};
	}

	function processDustCollectors(bank, shared, charactersItems) {
		const tmp = [];
		tmp.push(...extractDustCollectors(bank, 'bank'));
		tmp.push(...extractDustCollectors(shared, 'shared'));
		charactersItems.forEach((char) => {
			tmp.push(...extractDustCollectors(char._items, char.name));
		});

		const items = processItems(tmp);
		return {
			getRidSavings: getRidSavings(items),
			itemsToGetRidOf: items.filter((x) => x.savings > 0),
		};
	}

	function prepareAdvice(bank, shared, charactersItems) {
		const advice = { ...processStackable(bank, shared, charactersItems), ...processDustCollectors(bank, shared, charactersItems) };

		// console.log('#advice', advice);
		return advice;
	}

	function stackSavings(items) {
		let saved = 0;
		items.forEach((item) => {
			const total = sum(item.usage, 'count');
			const requiredSlots = Math.trunc(total / 250) + (total % 250 ? 1 : 0);
			// console.log(`savings ${item.item.name}`, total, requiredSlots, item.usage.length - requiredSlots);
			item.savings = item.usage.length - requiredSlots;
			saved += item.savings;
		});
		return saved;
	}

	function getRidSavings(items) {
		items.forEach((x) => {
			x.savings = x.usage.length;
		});
		return sum(items, 'savings');
	}
</script>

{#snippet itemAdvice(adv, idx)}
	<div class="item-cleanup">
		<Item item={{ ...adv.item, count: sum(adv.usage, 'count') }} />
		<ul>
			{#each adv.usage as usage}
				<li>{usage.count} - {usage.source}</li>
			{/each}
		</ul>
		<span class="savings">Slots to save: {adv.savings}</span>
	</div>
{/snippet}

<Awaiter promise={allData}>
	{#snippet children(result)}
		{#if result.stackSavings + result.getRidSavings > 0}
			<h3>Inventory cleanup advice</h3>
			<img src="/gw2helper/assets/150px-construction.png" title={$_('common.under_construction')} width="150px" alt="under construction" />
			<details class="searchable info" use:grungeBorder>
				<summary>Items that can be stacked. Slots to save: {result.stackSavings}</summary>
				<article use:autotooltip={tooltipOptions}>
					<p>Below you can find items that can be compacted to occupy less space. You can save up to {result.stackSavings} slots this way.</p>
					{#each result.itemsToStack as item, idx}
						{@render itemAdvice(item, idx)}
					{/each}
				</article>
			</details>
			<details class="searchable info" use:grungeBorder>
				<summary>Items that you should get rid of. Slots to save: {result.getRidSavings}</summary>
				<article use:autotooltip={tooltipOptions}>
					<p>
						Below you can find items that you should consider geting rid of. Use them, sell or just destroy if not worth selling. You can save up to {result.getRidSavings}
						slots this way.
					</p>
					{#each result.itemsToGetRidOf as item, idx}
						{@render itemAdvice(item, idx)}
					{/each}
				</article>
			</details>
		{/if}
	{/snippet}
</Awaiter>

<style>
	.item-cleanup {
		display: flex;
		justify-content: flex-start;
		align-items: center;
		gap: 1rem;
	}

	ul {
		width: 16rem;
		padding-left: 0;
		list-style-position: outside;
		padding-inline-start: 1.2rem;
	}


	.info {
		background-color: var(--gw2helper-info);
	}
</style>
