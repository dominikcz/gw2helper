<script>
    import { base } from '$app/paths';
    export let data;

    data.characters.sort((a,b) => -1 * (a.age - b.age))

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

    function hoursPlayed(time) {
        return Math.trunc(time / 3600);
    }

    function icon(name){
        return `${base}/assets/${name}`;
    }

    function iconOpacity(createdAt){
        let perc = (1 - tillBirthday(createdAt)/365);
        return perc < 0.1 ? 0.1 : perc;
    }

    function iconScale(createdAt){
        return 28 + (365 - tillBirthday(createdAt))/365 * 100;
    }

    function iconPosition(createdAt){
        return (128 - iconScale(createdAt)) / 2;
    }

</script>
<h1>Characters</h1>
<!-- <pre>
    {JSON.stringify(data, true)}
</pre> -->
{#each data.characters as char}
<article class="character">
    <h2>{char.name}</h2>
    <section style="background-image: url({icon(char.profession+'_icon.png')});'">
        <h4>{char.profession}</h4>
        <div class="info">hours played</div>
        <div class="counter">{hoursPlayed(char.age)}</div>
    </section>
    <section style="background-image: url({icon('Present_quaggan_icon.png')}); background-size: {iconScale(char.created)}px; background-position: {iconPosition(char.created)}px center;">
        <div class="counter">{age(char.created)} years</div>
        <div class="info">next birthday in</div>
        <div class="counter">{tillBirthday(char.created)}<span class="info">&nbsp;days</span></div>
    </section>
    <section style="background-image: url({icon('Grave_Finisher.png')});">
        <div class="info">died</div>
        <div class="counter">{char.deaths}</div>
        <div class="info">times</div>
    </section>
</article>
{/each}

<style lang="scss">
    article {
        width: 900px;
        margin: 10px 0;
        padding: 10px;
        display: flex;
        flex-flow: row wrap;
        column-gap: 20px;
        background-color: #dcdcdc;
        h2{
            width: 100%;
            margin: 0;
        }
        section{
            overflow: hidden;
            margin: 0;
            padding: 0;
            width: 280px;
            height: 150px;
            display: flex;
            flex-flow: column nowrap;
            background-repeat: no-repeat;
            justify-content: center;
            align-items: flex-start;
            padding: 0 0 0 140px;
            background-position: left center;            
        }
        .counter{
            padding: 0.5rem 0;
            font-size: x-large;
            font-weight: bold;
        }
        .info{
            font-size: 1rem;
            font-weight: normal;
        }
    }
</style>