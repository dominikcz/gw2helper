<script>
	import Awaiter from "$lib/components/awaiter.svelte";
    import Item from '$lib/components/items/item.svelte';
	import { autotooltip } from '$lib/actions/autotooltip';
	import { itemTooltipRenderer } from '$lib/components/items/itemTooltipRenderer';
	import { t as _ } from '$lib/services/i18n.js';

    export let data;

    let filter = '';

    const tooltipOptions = {
		customRenderers: {
			'img.item': itemTooltipRenderer,
		},
	};


</script>    




<Awaiter promise={data.current} let:result>
	<summary>buys
	<article>
    <div class="items autotooltip autotooltip-sticky" use:autotooltip={tooltipOptions} >
        {#each result.buys as item, index (`${item.id}-${index}`)}
            <Item {item} />
        {:else}
            <slot name="no-results">
                <span class="no-results">{$_('common.nothing_found')}</span>
            </slot>
        {/each}
    </div>
    </article>
    </summary>

    <summary>sells
        <article>
        <div class="items autotooltip autotooltip-sticky" use:autotooltip={tooltipOptions} >
            {#each result.sells as item, index (`${item.id}-${index}`)}
                <Item {item} />
            {:else}
                <slot name="no-results">
                    <span class="no-results">{$_('common.nothing_found')}</span>
                </slot>
            {/each}
        </div>
        </article>
        </summary>

   <pre>{JSON.stringify(result, null, 4)}</pre>
   <!-- <ItemsList summary={"buys"} items={result.buys} {filter} />
   <ItemsList summary={"sells"} items={result.sells} {filter} /> -->
</Awaiter>