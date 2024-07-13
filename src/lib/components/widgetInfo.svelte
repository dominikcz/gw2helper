<script lang="ts">
	export let title: string;
	export let value: string;
	export let image: string = '';

	function getImageStyle() {
		return image ? `background-image: url(${image});` : 'aqq';
	}

</script>

<div class="widget" style={getImageStyle()} {...$$restProps}>
	<div class="title">{title}</div>
	<div class="value">
		<slot {value}>
			{value}
		</slot>
	</div>
</div>
