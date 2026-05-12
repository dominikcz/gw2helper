<script lang="ts">
	import { grungeBorder } from '$lib/actions/grungeBorder';
	import { autotooltip } from '$lib/actions/autotooltip';

	interface Props {
		summary: string;
		open?: boolean;
		className?: string;
		tooltip?: boolean;
		stickyTooltip?: boolean;
		tooltipOptions?: unknown;
		summaryExtra?: import('svelte').Snippet;
		children?: import('svelte').Snippet;
	}

	let {
		summary,
		open = false,
		className = '',
		tooltip = false,
		stickyTooltip = false,
		tooltipOptions = undefined,
		summaryExtra,
		children,
	}: Props = $props();
</script>

<details
	class={`${className}${tooltip ? ' autotooltip' : ''}${tooltip && stickyTooltip ? ' autotooltip-sticky' : ''}`.trim()}
	{open}
	use:grungeBorder
	use:autotooltip={tooltip ? tooltipOptions : undefined}
>
	<summary>
		{summary}
		{#if summaryExtra}
			{@render summaryExtra()}
		{/if}
	</summary>
	{#if children}
		{@render children()}
	{/if}
</details>
