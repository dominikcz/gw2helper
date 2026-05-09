<script>
	/** @type {{value: any, compact?: boolean, class?: string}} */
	let { value, compact = true, class: className = '' } = $props();

	let decimal = $derived((value / 100).toFixed(2).split('.')[0]);
	let copper = $derived((value / 100).toFixed(2).split('.')[1] ?? '00');
	let silver = $derived(decimal.slice(-2));
	let gold = $derived(decimal.slice(0, -2));
</script>

<span class="price {className}">
	{#if value == 0}
		<span class="copper">0 </span><i class="copper" title="copper coin"></i>
	{:else}
		{#if gold}<span class="gold">{gold} </span><i class="gold" title="gold coin"></i>{/if}
		{#if silver && (!compact || silver != '00')}<span class="silver">{silver} </span><i class="silver" title="silver coin"></i>{/if}
		{#if !compact || copper != '00'}<span class="copper">{copper} </span><i class="copper" title="copper coin"></i>{/if}
	{/if}
</span>
