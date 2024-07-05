<script lang="ts">
    export let title: string;
    export let value: string;
</script>

<div class="widget" {...$$restProps}>
    <div class="title">{title}</div>
    <div class="value">{value}</div>    
</div>

