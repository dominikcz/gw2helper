<script lang="ts">
	/** @type {{languages?: any, value: any, keysOnly?: boolean}} */
	let { languages = {}, value = $bindable(), keysOnly = false } = $props();
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
        user-select: none;
    }
</style>