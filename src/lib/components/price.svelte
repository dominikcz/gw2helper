<script>
    export let value;
    const s = (value / 100).toFixed(2);
    const [decimal, copper] = s.split('.'); 
    const silver = decimal.slice(-2);
    const gold = decimal.slice(0, -2);
</script>

<span class="price">
    {#if gold}<span class="gold">{gold} <i title="gold coin"/></span>{/if}
    {#if silver}<span class="silver">{silver} <i title="silver coin"/></span>{/if}
    <span class="copper">{copper} <i title="copper coin"/></span>
</span>
