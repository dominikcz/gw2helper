<script lang="ts">
	import Chip from '$lib/components/chips/chip.svelte';
	import Chips from '$lib/components/chips/chips.svelte';
	import ItemTooltip from '$lib/components/items/itemTooltip.svelte';
	import Clock from '$lib/services/clock.svelte';

	let options0 = ['item 1a', 'item 2a', 'item 3a'];
	let choice0 = $state([]);

	let options1 = [
		{ label: 'item 1b', value: 'item-1b', selected: false },
		{ label: 'item 2b', value: 'item-2b', selected: false },
		{ label: 'item 3b', value: 'item-3b', selected: false },
	];
	let choice1 = $state([]);

	let options2 = {
		'item-1c': 'item 1c',
		'item-2c': 'item 2c',
		'item-3c': 'item 3c',
	};

	let choice2 = $state([]);

	let item1 = $state(true);
	let item2 = $state(false);

	const time1 = new Clock({ interval: 15000 });
	const time2 = new Clock({ interval: 500 });

	let itemTooltip1 = {
		name: 'Omnomberry Bar',
		type: 'Consumable',
		level: 80,
		rarity: 'Fine',
		vendor_value: 33,
		game_types: ['Wvw', 'Dungeon', 'Pve'],
		flags: ['NoSell'],
		restrictions: [],
		id: 12452,
		chat_link: '[&AgGkMAAA]',
		icon: 'https://render.guildwars2.com/file/6BD5B65FBC6ED450219EC86DD570E59F4DA3791F/433643.png',
		details: {
			type: 'Food',
			duration_ms: 1800000,
			apply_count: 1,
			name: 'Nourishment',
			icon: 'https://render.guildwars2.com/file/779D3F0ABE5B46C09CFC57374DA8CC3A495F291C/436367.png',
			description: '30% Magic Find\n40% Gold from Monsters\n+10% Experience from Kills',
		},
	};

	let itemTooltip2 = {
		name: 'Strong Soft Wood Longbow of Fire',
		description: '',
		type: 'Weapon',
		level: 44,
		rarity: 'Masterwork',
		vendor_value: 120,
		default_skin: 3942,
		game_types: ['Activity', 'Dungeon', 'Pve', 'Wvw'],
		flags: ['SoulBindOnUse'],
		restrictions: [],
		id: 28445,
		chat_link: '[&AgEdbwAA]',
		icon: 'https://render.guildwars2.com/file/C6110F52DF5AFE0F00A56F9E143E9732176DDDE9/65015.png',
		details: {
			type: 'LongBow',
			damage_type: 'Physical',
			min_power: 385,
			max_power: 452,
			defense: 0,
			infusion_slots: [],
			infix_upgrade: {
				attributes: [
					{ attribute: 'Power', modifier: 62 },
					{ attribute: 'Precision', modifier: 44 },
				],
			},
			suffix_item_id: 24547,
			secondary_suffix_item_id: '',
		},
	};

	let itemTooltip3 = {
		count: 234,
		name: 'Essence of Luck',
		description: 'Double-click to gain 10 luck.',
		type: 'Consumable',
		level: 0,
		rarity: 'Fine',
		vendor_value: 0,
		game_types: ['Pvp', 'PvpLobby', 'Wvw', 'Dungeon', 'Pve'],
		flags: ['AccountBound', 'NoSalvage', 'BulkConsume', 'AccountBindOnUse'],
		restrictions: [],
		id: 45175,
		chat_link: '[&AgF3sAAA]',
		icon: 'https://render.guildwars2.com/file/1BF5D192EE5DAF97A7F4090461C450DA00F8FFAC/631148.png',
		details: {
			type: 'Generic',
		},
	};
</script>

<details>
	<summary>Clock service</summary>
	<div class="test">
		<ul>
			<li>Current time (updated every 15 sec) is: {time1.value.toISOString()}</li>
			<li>Current time (updated every 500 msec) is: {time2.value.toISOString()}</li>
		</ul>
	</div>
</details>

<details>
	<summary>Chips</summary>
	<div class="test">
		<h2>array of strings</h2>
		<Chips options={options0} bind:value={choice0} />
		<pre>{JSON.stringify(choice0, null, 4)}</pre>

		<h2>array of objects</h2>
		<Chips options={options1} bind:value={choice1} />
		<pre>{JSON.stringify(choice1, null, 4)}</pre>

		<h2>object</h2>
		<Chips options={options2} bind:value={choice2} />
		<pre>{JSON.stringify(choice2, null, 4)}</pre>

		<h2>single items</h2>
		<Chip label="item a" bind:selected={item1} value="val-a" />
		{item1}
		<Chip label="item b" bind:selected={item2} value="val-b" />
		{item2}
	</div>
</details>

<details>
	<summary>item tooltip</summary>
	<ItemTooltip item={itemTooltip1} />
	<p></p>
	<ItemTooltip item={itemTooltip2} />
	<p></p>
	<ItemTooltip item={itemTooltip3} />
</details>

<style>
	.test {
		background-color: #555;
		padding: 0 1em;
	}
	:global(.formkit-chips) {
		margin-left: 1em !important;
	}
	:global(.formkit-chip) {
		width: 6em !important;
	}
</style>
