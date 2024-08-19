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

    import helperUtils from '$lib/utils/helper-utils';
    export let value: WizardsVaultObjective;

    function getClasses(){
        let cssClass = `category-${value.track}`;
        if (value.claimed) {
            cssClass += " claimed";
        }
        return cssClass;
    }

</script>

<div class="category {getClasses()}">
    <div class="main">
        <span>{value.title}</span>
        <progress value={value.progress_current <= value.progress_complete ? value.progress_current : value.progress_complete} max={value.progress_complete} /> 
    </div>
    <div class="reward">
        {value.acclaim} 
        <a class="tooltip-link" target="_blank" href="{helperUtils.wikiLink('Astral_Acclaim')}">
            <img src="/gw2helper/assets/rewards/Astral_Acclaim.png" title="Astral Acclaim" alt="Astral Acclaim"/>
        </a>
    </div>
</div>


<style lang="scss">
    .category{
        display: flex;
        flex-flow: row nowrap;
        padding: 0.4em 0.5em 0.4em 3em;
        column-gap: 1em;
        align-items: center;
        justify-content: space-between;
        .main{
            display: flex;
            flex-flow: column nowrap;
        }
        .reward{
            display: flex;
            flex-flow: row nowrap;
            align-items: center;
            img{
                width: 2em;
            }
        }
        &.category-WvW{
            background: #8d7624 url(/gw2helper/assets/rewards/Wizards_Vault_WvW.png) no-repeat 0.5em center;
            progress[value]{
                height: 1em;
                color: #d7b436 !important;
                background-color: #594b16;
                &::-moz-progress-bar{
                    background: #d7b436;	
                }
                &::-webkit-progress-value{
                    background: #d7b436;	
                }
                &::-webkit-progress-bar{
                    background: #594b16;
                }
            }
        }
        &.category-PvP{
            background: #610b0c url(/gw2helper/assets/rewards/Wizards_Vault_PvP.png) no-repeat 0.5em center;
            progress[value]{
                height: 1em;
                color: #801012 !important;
                background-color: #4b090a;
                &::-moz-progress-bar{
                    background: #4b090a;	
                }
                &::-webkit-progress-value{
                    background: #4b090a;	
                }
                &::-webkit-progress-bar{
                    background: #801012;
                }
            }
        }
        &.category-PvE{
            background: #2D710A url(/gw2helper/assets/rewards/Wizards_Vault_PvE.png) no-repeat 0.5em center;
            progress[value]{
                height: 1em;
                color: #378a0e !important;
                background-color: #235908;
                &::-moz-progress-bar{
                    background: #378a0e;	
                }
                &::-webkit-progress-value{
                    background: #378a0e;	
                }
                &::-webkit-progress-bar{
                    background: #235908;
                }
            }
        }        
    }
</style>