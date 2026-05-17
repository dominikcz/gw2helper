<script lang="ts">
	interface OutputItem {
		icon?: string | null;
		name?: string;
		rarity?: string;
		type?: string;
	}

	interface Props {
		outputItem?: OutputItem;
		outputCount: number;
	}

	let { outputItem, outputCount }: Props = $props();
</script>

{#if outputItem}
	<div class="output-hero">
		{#if outputItem.icon}<img src={outputItem.icon} alt="" class="output-icon" />{/if}
		<div class="output-info">
			<span class="output-name {outputItem.rarity ? `rarity-${outputItem.rarity.toLowerCase()}` : ''}">
				{outputItem.name}
			</span>
			<span class="output-rarity">{outputItem.rarity}{#if outputItem.type} · {outputItem.type}{/if}</span>
		</div>
		{#if outputCount > 1}
			<span class="output-count">×{outputCount}</span>
		{/if}
	</div>
{/if}

<style>
	.output-hero { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1.25rem; padding: 0.75rem 1rem; background: #1a1a2a; border: 1px solid #333; border-radius: 6px; }
	.output-icon { width: 48px; height: 48px; object-fit: contain; }
	.output-info { display: flex; flex-direction: column; }
	.output-name { font-size: 1.15rem; font-weight: bold; }
	.output-rarity { font-size: 0.8rem; color: #888; }
	.output-count { font-size: 1.1rem; color: #ccc; margin-left: auto; }
</style>
