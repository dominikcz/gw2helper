<script>
	/** @type {{item: any}} */
	let { item } = $props();

	let flags = getFlags();

	function getFlags() {
		if (item.flags) {
			return item.flags.join(', ');
		}
		return '';
	}

	function rarityClass() {
		return item.rarity ? `rarity-${item.rarity.toLowerCase()}` : '';
	}
</script>

<div class="item-descr">
	<div class="head">
		<img alt={item.name} src={item.icon} />
		<div class="caption {rarityClass()}">{item.count > 1 ? item.count : ''} {item.name}</div>
	</div>

	<div class="details">
		{#if item.description}<p>{@html item.description}</p>{/if}
		{#if item.level}<p>Required level: {item.level}</p>{/if}
		{#if flags}<p class="flags">{flags}</p>{/if}
	</div>
</div>

<style lang="scss" global>
	.item-descr {
		width: 100%;
		height: fit-content;
		display: flex;
		flex-flow: column nowrap;
		margin: 0;
		padding: 0;
        background: rgba(0, 0, 0, 0.5);
        padding: 0 0.4em 0.4em 0;
		.head {
			display: flex;
			flex-flow: row nowrap;
            height: 3.75em;
            align-items: center;
            justify-content: stretch;
            width: 100%;
            column-gap: 0.6em;
			img {
				border-width: 0.15em;
				border-style: solid;
				width: 3.75em;
				cursor: pointer;
			}
			.caption {
				font-size: 110%;
				padding: 0 0 0 0.2em;
			}
		}
        .details{
            padding: 0.4em;
        }
        .flags{
            font-size: 80%;
        }
	}
</style>
