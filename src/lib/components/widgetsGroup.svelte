<script lang="ts">
    export let name : string = '';

</script>

<div class="widgets-group">
    <h3>{name}</h3>
    <div class="widgets">
        <slot />
    </div>
</div>

<style lang="scss" global>
.widgets-group{
    display: flex;
    flex-flow: column nowrap;
    gap: 10px;
    h3{
        margin: 1rem 0 0 0;
    }
}

.widgets {
    display: flex;
    flex-flow: row wrap;
    gap: 10px;
    justify-content: flex-start;
}

</style>