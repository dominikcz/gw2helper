<script lang="ts">
	export let currency;

	import Price from '$lib/components/price.svelte';
	import helperUtils from '$lib/utils/helper-utils';
    import { dragHandle } from 'svelte-dnd-action';

	function getTitle(currency) {
		return `<h4>${currency.name} (${currency.id}) - <a class="autotooltip-link" target="_blank" href="${helperUtils.wikiLink(currency.name)}">Click for wiki</a></h4>
			${currency.depreciated ? '<p class="warning"><strong>DEPRECIATED:</strong> ' + currency.depreciationReason + '</p>' : ''}
			<p>${currency.description}</p>`;
	}

	function formatValue(v: number) {
		return v.toLocaleString('en-US', { maximumFractionDigits: 0 });
	}
</script>

<div class="currency autotooltip" class:depreciated={currency.depreciated} title={getTitle(currency)} data-autotooltip-class="autotooltip-wide">
	<span>
        <span class="handle" use:dragHandle aria-label="drag-handle for {currency.name}">⁝</span>
        <span class="currency-name autotooltip" title={getTitle(currency)}>{currency.name}</span>
    </span>
	<div class="currency-value">
		{#if currency.id == 1}
			<Price value={currency.value} />
		{:else}
			<span class:karma={currency.id == 2}>{formatValue(currency.value || 0)}</span>
			<img src={currency.icon} alt={currency.name} title={getTitle(currency)} class="autotooltip" />
		{/if}
	</div>
</div>

<style lang="scss">
	.currency {
		min-height: 2.5em;
		background-color: var(--gw2helper-module);
		color: var(--gw2helper-module-text);
		padding: 0 0.4em;
		gap: 1em;
		display: flex;
		flex-flow: row nowrap;
		justify-content: space-between;
		align-items: center;
        user-select: none;
		.handle {
			cursor: grab;
			&.grabbing {
				cursor: grabbing;
			}
		}
		&.depreciated {
			color: var(--gw2helper-not-important);
		}
		img {
			height: 2em;
		}
		.currency-value {
			display: flex;
			flex-flow: row nowrap;
			justify-content: flex-end;
			align-items: center;
			column-gap: 0.5em;
			font-size: 120%;
		}
	}
</style>
