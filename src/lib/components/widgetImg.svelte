<script lang="ts">
	export let title: string;
	export let url: string;
</script>

<div class="widget" {...$$restProps}>
    <div class="title">{title}</div>
	<img alt="" src={url} />
</div>

