<script lang="ts">
	import { autotooltip } from '$lib/actions/autotooltip';
	import { grungeBorder } from '$lib/actions/grungeBorder';
	import { asset } from '$app/paths';
	import Awaiter from '$lib/components/ui/awaiter.svelte';
	import { itemTooltipRenderer } from '../items/itemTooltipRenderer';
	import { t as _ } from '$lib/services/i18n';
	import Item from '../items/item.svelte';
	import { sum } from '$lib/utils';
	import SearchInput from '$lib/components/search/searchInput.svelte';

	type ItemUsage = {
		count: number;
		source: string;
	};

	type Advice = 'stack' | 'get-rid';

	type ItemAdvice = {
		item: MinifiedItem;
		advice: Advice;
		usage: ItemUsage[];
		savings: number;
	};

	type InventoryItem = {
		rarity: string;
		id: number;
		name: string;
		icon: string;
		count: number;
		type: string;
		binding?: string;
		equipped?: boolean;
		details?: {
			type?: string;
		};
	};

	type MinifiedItem = {
		rarity: string;
		id: number;
		name: string;
		icon: string;
		count: number;
		type: string;
		subtype: string;
	};

	type CharacterItems = {
		name: string;
		_items: InventoryItem[];
	};

	type AdviceEntry = {
		item: MinifiedItem;
		source: string;
	};

	type AdviceSummary = {
		stackSavings: number;
		itemsToStack: ItemAdvice[];
		getRidSavings: number;
		itemsToGetRidOf: ItemAdvice[];
	};

	type InventorySource = InventoryItem[] | Promise<InventoryItem[]>;
	type CharacterSource = CharacterItems[] | Promise<CharacterItems[]>;

	let { bank = [], shared = [], charactersItems = [] }: { bank?: InventorySource; shared?: InventorySource; charactersItems?: CharacterSource } = $props();

	let allData = new Promise<AdviceSummary>((resolve, reject) => {
		Promise.all([bank, shared, charactersItems])
			.then(([_bank, _shared, _charactersItems]: [InventoryItem[], InventoryItem[], CharacterItems[]]) => {
				resolve(prepareAdvice(_bank, _shared, _charactersItems));
			})
			.catch((error) => reject(error));
	});

	let char = $state($_('items.cleanup.all_characters'));

	const tooltipOptions = {
		customRenderers: {
			'img.item': itemTooltipRenderer,
		},
	};

	function minifyItem(x: InventoryItem): MinifiedItem {
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
	function extractStackable(items: InventoryItem[], source: string): AdviceEntry[] {
		return items
			.filter(
				(x: InventoryItem) =>
					['CraftingMaterial', 'Consumable', 'Trophy', 'Gizmo', 'UpgradeComponent', 'Container'].includes(x.type) &&
					x.count < 250 &&
					x.binding != 'Character' &&
					!x.equipped
			)
			.map((x: InventoryItem) => ({
				item: minifyItem(x),
				source,
			}));
	}

	function extractDustCollectors(items: InventoryItem[], source: string): AdviceEntry[] {
		const res = items
			.filter(
				(x: InventoryItem) =>
					(['MiniPet'].includes(x.type) && x.count < 250) ||
					(['Armor', 'Weapon'].includes(x.type) && !x.equipped) ||
					(x.type == 'Consumable' && ['Booze', 'Generic', 'Halloween', 'RandomUnlock', 'Transmutation', 'Unlock', 'Utility'].includes(x.details?.type ?? ''))
			)
			.map((x: InventoryItem) => ({
				item: minifyItem(x),
				source,
			}));
		return res;
	}

	function processItems(tmp: AdviceEntry[]): ItemAdvice[] {
		let adviceRegistry = new Map<number, ItemAdvice>();
		tmp.forEach((x: AdviceEntry) => {
			let adv = adviceRegistry.get(x.item.id);
			if (!adv) {
				adv = {
					item: x.item,
					advice: 'stack',
					usage: [
						{
							count: x.item.count,
							source: x.source,
						},
					],
					savings: 0,
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

	function processStackable(bank: InventoryItem[], shared: InventoryItem[], charactersItems: CharacterItems[]) {
		const tmp: AdviceEntry[] = [];
		tmp.push(...extractStackable(bank, 'bank'));
		tmp.push(...extractStackable(shared, 'shared'));
		charactersItems.forEach((char: CharacterItems) => {
			tmp.push(...extractStackable(char._items, char.name));
		});

		const items = processItems(tmp);
		items.forEach((item) => {
			item.advice = 'stack';
		});
		return {
			stackSavings: stackSavings(items),
			itemsToStack: items.filter((x) => x.savings > 0),
		};
	}

	function processDustCollectors(bank: InventoryItem[], shared: InventoryItem[], charactersItems: CharacterItems[]) {
		const tmp: AdviceEntry[] = [];
		tmp.push(...extractDustCollectors(bank, 'bank'));
		tmp.push(...extractDustCollectors(shared, 'shared'));
		charactersItems.forEach((char: CharacterItems) => {
			tmp.push(...extractDustCollectors(char._items, char.name));
		});

		const items = processItems(tmp);
		items.forEach((item) => {
			item.advice = 'get-rid';
		});
		return {
			getRidSavings: getRidSavings(items),
			itemsToGetRidOf: items.filter((x) => x.savings > 0),
		};
	}

	function prepareAdvice(bank: InventoryItem[], shared: InventoryItem[], charactersItems: CharacterItems[]): AdviceSummary {
		const advice = { ...processStackable(bank, shared, charactersItems), ...processDustCollectors(bank, shared, charactersItems) };

		// console.log('#advice', advice);
		return advice;
	}

	function stackSavings(items: ItemAdvice[]) {
		let saved = 0;
		items.forEach((item: ItemAdvice) => {
			const total = sum(item.usage, 'count');
			const requiredSlots = Math.trunc(total / 250) + (total % 250 ? 1 : 0);
			// console.log(`savings ${item.item.name}`, total, requiredSlots, item.usage.length - requiredSlots);
			item.savings = item.usage.length - requiredSlots;
			saved += item.savings;
		});
		return saved;
	}

	function getRidSavings(items: ItemAdvice[]) {
		items.forEach((x: ItemAdvice) => {
			x.savings = x.usage.length;
		});
		return sum(items, 'savings');
	}

	function getCharacters(itemsToStack: ItemAdvice[]) {
		const list = [$_('items.cleanup.all_characters')];

		const sources = new Set<string>();
		itemsToStack.forEach((element: ItemAdvice) => {
			element.usage.forEach((u: ItemUsage) => {
				if (u.source != 'bank' && u.source != 'shared') {
					sources.add(u.source);
				}
			});
		});
		list.push(...Array.from(sources).sort((a, b) => a.localeCompare(b)));
		return list;
	}

	function filteredItems(items: ItemAdvice[]) {
		if (!char || char == $_('items.cleanup.all_characters')) return items;
		return items.filter((x: ItemAdvice) => x.usage.some((u: ItemUsage) => u.source == char));
	}

	function sourceLabel(source: string) {
		if (source === 'bank') return $_('items.bank');
		if (source === 'shared') return $_('items.shared_inventory');
		return source;
	}
</script>

{#snippet itemAdvice(adv: ItemAdvice, idx: number)}
	<div class="item-cleanup" class:odd={idx % 2}>
		<Item item={{ ...adv.item, count: sum(adv.usage, 'count') }} />
		<ul>
			{#each adv.usage as usage}
				<li class:highlight={usage.source == char}>{usage.count} - {sourceLabel(usage.source)}</li>
			{/each}
		</ul>
		<span class="savings">{$_('items.cleanup.slots_to_save', { slots: adv.savings })}</span>
	</div>
{/snippet}

<Awaiter promise={allData}>
	{#snippet children(result: AdviceSummary)}
		{#if result.stackSavings + result.getRidSavings > 0}
			<details use:grungeBorder={{ grunge: true }}>
				<summary>{$_('items.cleanup.summary', { slots: result.stackSavings + result.getRidSavings })}</summary>
				<article>
					<!-- <img src={asset('/assets/150px-construction.png')} title={$_('common.under_construction')} width="150px" alt={$_('common.under_construction')} /> -->
					<p>
						{$_('items.cleanup.filter_by_character')}
						<SearchInput name="char" id="char" bind:value={char} options={getCharacters(result.itemsToStack)} />
					</p>

					<details class="info" use:grungeBorder>
						<summary>{$_('items.cleanup.stackable_summary', { slots: result.stackSavings })}</summary>
						<article use:autotooltip={tooltipOptions}>
							<p>{$_('items.cleanup.stackable_description', { slots: result.stackSavings })}</p>
							{#each filteredItems(result.itemsToStack) as item, idx}
								{@render itemAdvice(item, idx)}
							{/each}
						</article>
					</details>
					<details class="info" use:grungeBorder>
						<summary>{$_('items.cleanup.get_rid_summary', { slots: result.getRidSavings })}</summary>
						<article use:autotooltip={tooltipOptions}>
							<p>
								{$_('items.cleanup.get_rid_description', { slots: result.getRidSavings })}
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
		/* list-style-position: inside; */
		list-style: none;
		padding-inline-start: 0;
		margin: 0.2rem 0;
	}

	li{
		padding: 0 0.4rem;
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
