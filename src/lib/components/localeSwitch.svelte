<script>
    import { createEventDispatcher } from "svelte";
    export let languages = {};
    export let value;
    export let keysOnly = false;

    const dispatch = createEventDispatcher();

    function hndOnChange(){
        dispatch('locale-changed', {
            locale: value
        })
    }
</script>

<select bind:value id="locale-switch" on:change={() => hndOnChange()}>
	{#each Object.keys(languages) as key}
		<option value={key}>{keysOnly ? key.toUpperCase() : languages[key]}</option>
	{/each}
</select>

<style lang="scss">
    select {
        border: none;
        background-color: #222;
        color: inherit;
        margin-left: 1em;
    }
</style>