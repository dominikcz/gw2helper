<script>
	export let value;
	export let compact = true;
	const s = (value / 100).toFixed(2);
	const [decimal, copper] = s.split('.');
	const silver = decimal.slice(-2);
	const gold = decimal.slice(0, -2);
</script>

<span class="price">
	{#if value == 0}
		<span class="copper">0 </span><i class="copper" title="copper coin" />
	{:else}
		{#if gold}<span class="gold">{gold} </span><i class="gold" title="gold coin" />{/if}
		{#if silver && (!compact || silver != '00')}<span class="silver">{silver} </span><i class="silver" title="silver coin" />{/if}
		{#if !compact || copper != '00'}<span class="copper">{copper} </span><i class="copper" title="copper coin" />{/if}
	{/if}
</span>
