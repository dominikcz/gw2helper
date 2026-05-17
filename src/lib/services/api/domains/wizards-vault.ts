import type { WizardsVaultCategoryData } from '$lib/types/gw2-api';

export function sortWizardsVaultObjectives(resp: WizardsVaultCategoryData): WizardsVaultCategoryData {
    const byClaimed = Object.groupBy((resp.objectives || []), (x) => String(Boolean(x.claimed))) as Record<string, NonNullable<WizardsVaultCategoryData['objectives']>>;
    byClaimed.false ??= [];
    byClaimed.true ??= [];
    resp.objectives = byClaimed.false.sort((a, b) => a.track.localeCompare(b.track) || a.title.localeCompare(b.title));
    resp.objectives.push(...byClaimed.true.sort((a, b) => a.track.localeCompare(b.track) || a.title.localeCompare(b.title)));
    return resp;
}
