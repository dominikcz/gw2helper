<script>
    export let data;

    function diff(createdAt){
        const dt = new Date(createdAt)
        return Math.floor(((new Date()).getTime() - dt.getTime()) / (1000 * 3600 * 24));
    }
    function tillBirthday(createdAt){
        return 365 - (diff(createdAt) % 365);
    }

    function age(createdAt) {
        return Math.floor(diff(createdAt) / 365)
    }

</script>
<h1>Characters</h1>
<!-- <pre>
    {JSON.stringify(data, true)}
</pre> -->
{#each data.characters as char}
    <li>{char.name} - {age(char.created)}yo, next birthday in {tillBirthday(char.created)} days</li>
{/each}