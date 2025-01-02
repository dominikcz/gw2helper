<script lang="ts">
    interface Props {
        name?: string;
        children?: import('svelte').Snippet;
    }

    let { name = '', children }: Props = $props();

</script>

<div class="widgets-group">
    <h3>{name}</h3>
    <div class="widgets">
        {@render children?.()}
    </div>
</div>

<style lang="scss" global>
.widgets-group{
    display: flex;
    flex-flow: column nowrap;
    gap: 0.625em;
    h3{
        margin: 1em 0 0 0;
    }
}

.widgets {
    display: flex;
    flex-flow: row wrap;
    gap: 0.625em;
    justify-content: flex-start;
}

</style>