<script lang="ts">
	import { resolve } from '$app/paths';

	interface Props {
		stackIds: number[];
		back?: string;
		stackItems?: Record<number, string>;
		itemId: number;
		outputName?: string;
	}

	let { stackIds, back = '', stackItems = {}, itemId, outputName }: Props = $props();
</script>

{#if stackIds.length > 0}
	<nav class="breadcrumb">
		<a href={resolve('/recipies') + back}>All items</a>
		{#each stackIds as parentId, i (parentId)}
			<span>›</span>
			<a href={resolve(`/recipies/${parentId}${i > 0 ? `?stack=${stackIds.slice(0, i).join(',')}` : ''}`)}>
				{stackItems[parentId] ?? `#${parentId}`}
			</a>
		{/each}
		<span>›</span>
		<span>{outputName ?? `#${itemId}`}</span>
	</nav>
{:else}
	<nav class="breadcrumb">
		<a href={resolve('/recipies') + back}>All items</a>
		<span>›</span>
		<span>{outputName ?? `#${itemId}`}</span>
	</nav>
{/if}

<style>
	.breadcrumb { display: flex; gap: 0.5rem; align-items: center; margin-bottom: 1rem; font-size: 0.9rem; }
	.breadcrumb a { color: #80c4ff; text-decoration: none; }
	.breadcrumb a:hover { text-decoration: underline; }
</style>
