<script lang="ts">
    export let title: string;
    export let value: string;
</script>

<div class="widget" {...$$restProps}>
    <div class="title">{title}</div>
    <div class="value">{value}</div>    
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
        .value{
            font-size: x-large;
            text-align: right;
            margin-top: 0.6rem;
        }
    }
</style>