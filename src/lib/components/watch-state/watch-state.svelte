<script>
	/** @type {{watched: any, title: any, onClick: any}} */
	let { watched, title, onClick } = $props();

</script>

<div class= "watched-state" class:watched {title} onclick={onClick}></div>

<style lang="scss">
	.watched-state {
		background: url(/gw2helper/assets/rewards/map_heart-sprite.png) no-repeat top center;
		padding: 0;
		border-radius: 0;
		margin: 0;
		width: 2em;
		height: 2em;
		cursor: pointer;
		flex-shrink: 0;
		&.watched {
			background-position-y: -2em;
		}
	}
</style>
