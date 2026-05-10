export type BitType = 'Item' | 'Minipet' | 'Skin' | string;

export interface AchievementBit {
    id?: number;
    type?: BitType;
    text?: string;
}

export interface CachedEntity {
    name?: string;
    icon?: string;
}

export type RendererPayload = number[] | { bitsDone?: number[]; done?: boolean } | undefined;

export type MasteryRegion = 'Tyria' | 'Maguuma' | 'Desert' | 'Tundra' | 'Jade' | 'Sky' | 'Unknown' | string;

export interface CoinReward {
    count: number;
}

export interface MasteryReward {
    region: MasteryRegion;
}

export interface RewardsObj {
    title?: unknown;
    coins?: CoinReward[];
    item?: unknown;
    mastery?: MasteryReward[];
}
