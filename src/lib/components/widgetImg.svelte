<script lang="ts">
	export let title: string;
	export let url: string;
</script>

<div class="widget" {...$$restProps}>
    <div class="title">{title}</div>
	<img alt="" src={url} />
</div>

<style lang="scss">
	.widget {
		border-radius: 5px;
		background-color: var(--gw2helper-module);
		color: #000;
		display: flex;
		flex-flow: column nowrap;
		padding: 10px;
		min-width: 160px;
		align-items: flex-start;
		img {
			width: 120px;
			height: 120px;
			object-fit: contain;
			align-self: center;
		}
	}
</style>
