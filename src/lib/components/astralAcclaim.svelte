<script lang="ts">
    import helperUtils from "$lib/utils/helper-utils";
    import { asset } from "$app/paths";
    import { t as _ } from "$lib/services/i18n";
</script>

<a class="tooltip-link" target="_blank" href={helperUtils.wikiLink('Astral_Acclaim')}>
    <img src={asset('/assets/rewards/Astral_Acclaim.png')} title="Astral Acclaim - {$_('common.click_for_wiki')}" alt="Astral Acclaim" />
</a>

<style>
    img{
        width: 2em;
        height: 2em;
    }
    .tooltip-link{
        height: 2em;
    }
</style>