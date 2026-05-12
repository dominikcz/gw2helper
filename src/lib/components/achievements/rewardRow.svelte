<script lang="ts">
	interface Props {
		icon: string;
		alt: string;
		className?: string;
		children?: import('svelte').Snippet;
	}

	let { icon, alt, className = '', children }: Props = $props();
</script>

<li class={`reward-row ${className}`.trim()}>
	<img src={icon} {alt} />
	{#if children}
		{@render children()}
	{/if}
</li>

<style lang="scss">
	.reward-row {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.5em;

		> img {
			width: 1.4em;
			height: 1.4em;
			object-fit: contain;
		}

	}

	.reward-row-items {
		align-items: flex-start;
	}
</style>
