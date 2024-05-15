<script>
	export let data;
	console.log('bank', data.bank);
</script>

<h1>Items</h1>
<div>
	{#each data.bank as item}
		<img class="icon rarity-{item.rarity}" alt={item.name} title="" src={item.icon} />
	{/each}
</div>
