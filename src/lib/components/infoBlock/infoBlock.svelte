<script lang="ts">
	interface Props {
		caption?: string;
		kind?: 'info' | 'error';
		children?: import('svelte').Snippet;
	}

	let { caption = 'Hint', kind = 'info', children }: Props = $props();
</script>

<div class="info-block {kind}">
	<h4>{caption}</h4>
	<p>
		{#if children}{@render children()}{/if}
	</p>
</div>

<style lang="scss">
	.info-block {
		margin: 1em 0;
		color: var(--gw2helper-module-text);
		border-color: var(--gw2helper-info);
		border-radius: 0.3125em;
		background: var(--asset-report-icon) 0.5em center no-repeat;
		width: fit-content;
		&.info{
			background-color: var(--gw2helper-info);
		}

		&.error{
			background-color: var(--gw2helper-error);
		}

		h4 {
			margin: 0.5em 0.6em 0 3em;
		}

		p {
			margin: 0.3em 0.6em 0.5em 3em;
			padding: 0;
		}
	}
</style>
