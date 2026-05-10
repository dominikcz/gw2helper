export interface ItemBaseData {
    id: number;
    name?: string;
    icon?: string;
    rarity?: string;
    count?: number;
    locked?: boolean;
}

export interface ItemTooltipData extends ItemBaseData {
    description?: string;
    level?: number;
    flags?: string[];
    [key: string]: unknown;
}

export interface ItemRendererParams {
    count?: number;
}
