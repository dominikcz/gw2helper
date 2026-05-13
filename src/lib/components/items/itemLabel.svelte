<script lang="ts">
	interface Props {
		id?: number;
		name?: string;
		icon?: string;
		rarity?: string;
		count?: number;
		showCount?: boolean;
		showId?: boolean;
		iconSize?: string;
		href?: string;
		crossed?: boolean;
		class?: string;
	}

	let {
		id,
		name,
		icon,
		rarity,
		count = 0,
		showCount = false,
		showId = false,
		iconSize = '3.75em',
		href,
		crossed = false,
		class: className = ''
	}: Props = $props();

	const rarityClass = $derived(rarity ? `rarity-${rarity.toLowerCase()}` : '');
	const label = $derived(name || (id != null ? `#${id}` : '?'));
	const finalHref = $derived(href);
</script>

<span class="item-label {className}">
	<span class="icon-frame rarity {rarityClass}" style={`--item-icon-size: ${iconSize};`}>
		{#if finalHref}
			<a class="item-link" href={finalHref} target="_blank" rel="noopener noreferrer">
				{#if icon}
					<img src={icon} alt={label} loading="lazy" decoding="async" fetchpriority="low" />
				{:else}
					<span class="icon-placeholder"></span>
				{/if}
			</a>
		{:else}
			{#if icon}
				<img src={icon} alt={label} loading="lazy" decoding="async" fetchpriority="low" />
			{:else}
				<span class="icon-placeholder"></span>
			{/if}
		{/if}
	</span>
	<span class="caption {rarityClass}" class:crossed>
		{#if showCount && count > 1}{count}x {/if}{label}{#if showId && id != null} (id: {id}){/if}
	</span>
</span>

<style lang="scss">
	.item-label {
		display: inline-flex;
		align-items: center;
		gap: 0.45em;
		min-width: 0;
	}

	.item-link {
		display: inline-flex;
		align-items: center;
		width: var(--item-icon-size);
		height: var(--item-icon-size);
	}

	.icon-frame {
		width: var(--item-icon-size);
		height: var(--item-icon-size);
		outline-width: 0.1875em;
		outline-style: solid;
		position: relative;
		flex: 0 0 auto;
	}

	img,
	.icon-placeholder {
		width: var(--item-icon-size);
		height: var(--item-icon-size);
		display: block;
	}

	.icon-placeholder {
		display: inline-block;
		background: rgba(255, 255, 255, 0.15);
	}

	.caption {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.caption.crossed {
		text-decoration: line-through;
		text-decoration-thickness: 0.12em;
	}
</style>
