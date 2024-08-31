<script>
	import Chip from '$lib/components/chips/chip.svelte';
	import Chips from '$lib/components/chips/chips.svelte';
	import clock from '$lib/stores/clock.js';

	let options0 = ['item 1a', 'item 2a', 'item 3a'];
	let choice0 = [];

	let options1 = [
		{ label: 'item 1b', value: 'item-1b', selected: false },
		{ label: 'item 2b', value: 'item-2b', selected: false },
		{ label: 'item 3b', value: 'item-3b', selected: false },
	];
	let choice1 = [];

	let options2 = {
		'item-1c': 'item 1c',
		'item-2c': 'item 2c',
		'item-3c': 'item 3c',
	};

	let choice2 = [];

	let item1 = true;
	let item2 = false;

	const time1 = clock({ interval: 15000 });
	const time2 = clock({ interval: 500 });
</script>

<details class="test">
	<summary>Clock store</summary>
	<ul>
		<li>Current time (updated every 15 sec) is: {$time1.toISOString()}</li>
		<li>Current time (updated every 500 msec) is: {$time2.toISOString()}</li>
	</ul>
</details>

<details class="test">
	<summary>Chips</summary>
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
</details>

<style>
	.test {
		background-color: #555;
	}
</style>
