<script>
	import Chip from '$lib/components/chips/chip.svelte';
	import Chips from '$lib/components/chips/chips.svelte';

	let options1 = [
		{ label: 'item 1a', value: 'item-1a', selected: false },
		{ label: 'item 2a', value: 'item-2a', selected: false },
		{ label: 'item 3a', value: 'item-3a', selected: false },
	];
    let choice1 = [];

	let options2 = {
        'item-1b': 'item 1b',
        'item-2b': 'item 2b',
        'item-3b': 'item 3b',
    }
		
    let choice2 = [];
    
    let item1 = true;
    let item2 = false;

</script>

<h2>array of objects</h2>
<Chips options={options1} bind:value={choice1} />
<pre>
{JSON.stringify(choice1, null, 4)}
</pre>

<h2>object</h2>
<Chips options={options2} bind:value={choice2} />
<pre>
{JSON.stringify(choice2, null, 4)}
</pre>

<h2>single items</h2>
<Chip label="item a" bind:selected={item1} value="val-a" /> {item1}
<Chip label="item b" bind:selected={item2} value="val-b"/> {item2}

