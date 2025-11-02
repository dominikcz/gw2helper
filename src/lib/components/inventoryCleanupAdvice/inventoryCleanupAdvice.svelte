<script lang="ts">
	import { autotooltip } from '$lib/actions/autotooltip';
	import { grungeBorder } from '$lib/actions/grungeBorder';
	import Awaiter from '../awaiter.svelte';
	import { itemTooltipRenderer } from '../items/itemTooltipRenderer';
	import { t as _, t } from '$lib/services/i18n.js';
	import Item from '../items/item.svelte';
	import { sum } from '$lib/utils';
	import SearchInput from '../searchInput.svelte';

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

	let char = $state('--- any ---');

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

	function getCharacters(itemsToStack) {
		const list = ['--- any ---'];

		const sources = new Set();
		itemsToStack.forEach((element) => {
			element.usage.forEach((u) => {
				if (u.source != 'bank' && u.source != 'shared') {
					sources.add(u.source);
				}
			});
		});
		list.push(...Array.from(sources).sort((a, b) => a.localeCompare(b)));
		return list;
	}

	function filteredItems(items) {
		if (!char || char == '--- any ---') return items;
		return items.filter((x) => x.usage.some((u) => u.source == char));
	}
</script>

{#snippet itemAdvice(adv, idx)}
	<div class="item-cleanup" class:odd={idx % 2}>
		<Item item={{ ...adv.item, count: sum(adv.usage, 'count') }} />
		<ul>
			{#each adv.usage as usage}
				<li class:highlight={usage.source == char}>{usage.count} - {usage.source}</li>
			{/each}
		</ul>
		<span class="savings">Slots to save: {adv.savings}</span>
	</div>
{/snippet}

<Awaiter promise={allData}>
	{#snippet children(result)}
		{#if result.stackSavings + result.getRidSavings > 0}
			<details class="searchable" use:grungeBorder={{ grunge: true }}>
				<summary>Inventory cleanup advice: {`${result.stackSavings + result.getRidSavings} slots to save`}</summary>
				<article>
					<img src="/gw2helper/assets/150px-construction.png" title={$_('common.under_construction')} width="150px" alt="under construction" />
					<p>
						Show only items of character:
						<SearchInput name="char" id="char" bind:value={char} options={getCharacters(result.itemsToStack)} />
					</p>

					<details class="info" use:grungeBorder>
						<summary>Items that can be stacked. Slots to save: {result.stackSavings}</summary>
						<article use:autotooltip={tooltipOptions}>
							<p>Below you can find items that can be compacted to occupy less space. This can save you up to {result.stackSavings} slots.</p>
							{#each filteredItems(result.itemsToStack) as item, idx}
								{@render itemAdvice(item, idx)}
							{/each}
						</article>
					</details>
					<details class="info" use:grungeBorder>
						<summary>Items that you should get rid of. Slots to save: {result.getRidSavings}</summary>
						<article use:autotooltip={tooltipOptions}>
							<p>
								Below you can find items that you should consider getting rid of. You can use, sell, or discard them if they are not worth
								selling. You can save up to {result.getRidSavings} slots this way.
							</p>
							{#each filteredItems(result.itemsToGetRidOf) as item, idx}
								{@render itemAdvice(item, idx)}
							{/each}
						</article>
					</details>
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
		margin: 0.2rem 0;
	}

	.item-cleanup {
		padding: 0 0 0 0.8rem;
		min-height: 80px;
	}
	.odd {
		background-color: color-mix(in srgb, black 30%, transparent);
	}

	.info {
		background-color: var(--gw2helper-info);
	}

	.highlight {
		background-color: var(--gw2helper-highlight-background);
		color: var(--gw2helper-highlight-text);
	}
</style>
