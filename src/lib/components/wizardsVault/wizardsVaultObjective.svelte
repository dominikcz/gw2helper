<script lang="ts">
    interface WizardsVaultObjective {
      id: number,
      title: string,
      track: "WvW" | "PvE" | "PVP",
      acclaim: number,
      progress_current: number,
      progress_complete: number,
      claimed: boolean
    }

    export let value: WizardsVaultObjective;

    function getClasses(){
        let cssClass = `category-${value.track}`;
        if (value.claimed) {
            cssClass += "claimed";
        }
        return cssClass;
    }

</script>

<div class="category {getClasses()}">
    <span>{value.title}</span>
    <progress value={value.progress_current <= value.progress_complete ? value.progress_current : value.progress_complete} max={value.progress_complete} /> 
    <div>{value.acclaim}</div>
</div>


<style lang="scss">
    .category{
        .category-WvW{
            background: #3b310d url(/gw2helper/assets/rewards/Wizards_Vault_WvW.png) no-repeat center center;
        }
    }
</style>