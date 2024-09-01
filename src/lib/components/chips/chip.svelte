<script lang="ts">
	import { createEventDispatcher } from 'svelte';

    export let name: string = '';
    export let id: string = '';
    export let label: string;
    export let title: string = '';
    export let value: any;
    export let selected: boolean = false;

	const dispatch = createEventDispatcher();

    function toggleSelected(){
        selected = !selected;
        dispatch('toggle-chip', {
				name,
				id,
                label,
                value,
                selected
			});
    }

</script>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions svelte-ignore a11y-no-static-element-interactions-->
<span class="formkit-chip" class:selected on:click={toggleSelected} {id} {title} data-name={name} data-value={value} >
    {label}
</span>

<style lang="scss">
    .formkit-chip{
        font-size: 0.8em;
        border-radius: 5px;
        padding: 0.3em 0.6em;
        background-color: var(--gw2helper-module);
        color: var(--gw2helper-module-text);
        width: 5em;
        text-align: right;
        user-select: none;
        cursor: pointer;
        &.selected{
            background-color: var(--gw2helper-module-white); 
            &::before {
                content: "\2713\ ";
            }
        }
    }
</style>