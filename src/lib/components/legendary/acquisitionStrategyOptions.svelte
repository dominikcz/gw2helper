<script lang="ts">
	import Price from '$lib/components/currencies/price.svelte';

	type AcquisitionSource = 'tp' | 'craft' | 'vendor' | 'none';

	interface Props {
		groupName: string;
		selected: AcquisitionSource;
		tpAvailable: boolean;
		craftAvailable: boolean;
		vendorAvailable: boolean;
		tpUnit: number | null;
		craftUnit: number | null;
		vendorUnit: number | null;
		hasMultipleSources: boolean;
		onSelect: (source: 'tp' | 'craft' | 'vendor') => void;
	}

	let {
		groupName,
		selected,
		tpAvailable,
		craftAvailable,
		vendorAvailable,
		tpUnit,
		craftUnit,
		vendorUnit,
		hasMultipleSources,
		onSelect,
	}: Props = $props();
</script>

{#if tpAvailable && tpUnit != null}
	<label class="strategy-line">
		<input
			type="radio"
			name={groupName}
			disabled={!hasMultipleSources}
			checked={selected === 'tp'}
			onclick={() => onSelect('tp')}
		/>
		<span class="strategy-name">TP</span>
		<span class="strategy-price"><Price value={tpUnit} compact={false} /></span>
	</label>
{/if}

{#if craftAvailable && craftUnit != null}
	<label class="strategy-line">
		<input
			type="radio"
			name={groupName}
			disabled={!hasMultipleSources}
			checked={selected === 'craft'}
			onclick={() => onSelect('craft')}
		/>
		<span class="strategy-name">CRAFT</span>
		<span class="strategy-price"><Price value={craftUnit} compact={false} /></span>
	</label>
{/if}

{#if vendorAvailable && vendorUnit != null}
	<label class="strategy-line">
		<input
			type="radio"
			name={groupName}
			disabled={!hasMultipleSources}
			checked={selected === 'vendor'}
			onclick={() => onSelect('vendor')}
		/>
		<span class="strategy-name">VENDOR</span>
		<span class="strategy-price"><Price value={vendorUnit} compact={false} /></span>
	</label>
{/if}