<script>
	import WizardsVaultObjective from "$lib/components/wizardsVault/wizardsVaultObjective.svelte";
    import { weekly } from './weekly';
</script>

<img src="/gw2helper/assets/150px-construction.png" title="Under constrution" width="150px" alt="under construction"/>

<h1>Wizard's Vault</h1>


<details>
    <summary>Daily <progress value=1 max=4/></summary>
    <article>

    </article>
</details>

<details>
    <summary>Weekly</summary>
    <article>
        {#each weekly.objectives as value}
        <WizardsVaultObjective {value} />
        {/each}
    </article>
</details>

<details>
    <summary>Special</summary>
    <article>

    </article>
</details>

<h1>Wizard's Vault</h1>