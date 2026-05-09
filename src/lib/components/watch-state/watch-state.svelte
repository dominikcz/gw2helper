<script>
	/** @type {{watched: any, title: any, onClick: any}} */
	let { watched, title, onClick } = $props();
</script>

<button class="watched-state" class:watched {title} onclick={onClick} aria-label="watched state"></button>

<style lang="scss">
	.watched-state {
		background: var(--asset-map-heart-sprite) no-repeat top center;
		border: none;
		padding: 0;
		border-radius: 0;
		margin: 0;
		width: 2rem;
		height: 2rem;
		cursor: pointer;
		flex-shrink: 0;
		&.watched {
			background-position-y: -2rem;
		}
	}
</style>
