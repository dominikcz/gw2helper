<script>
    export let languages = {};
    export let value;
    export let keysOnly = false;
</script>

<select bind:value id="locale-switch">
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