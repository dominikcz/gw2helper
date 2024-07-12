<script lang="ts">
	export let title: string;
	export let url: string;
</script>

<div class="widget image" {...$$restProps} style="background-image: url({url})" >
    <div class="title">{title}</div>
</div>

