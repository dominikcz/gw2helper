import type { AchievementBit } from '$lib/types/achievements';
import type { ItemTooltipData } from '$lib/types/items';

export type ApiIsoDate = string;

export interface ApiAccountDto {
    id: string;
    age: number;
    name: string;
    world: number;
    guilds?: string[];
    guild_leader?: string[];
    created: ApiIsoDate;
    access: string[];
    commander?: boolean;
    fractal_level?: number;
    daily_ap?: number;
    monthly_ap?: number;
    wvw_rank?: number;
    last_modified?: ApiIsoDate;
}

export interface ApiAccountAchievementDto {
    id: number;
    bits?: number[];
    current?: number;
    max?: number;
    done: boolean;
    repeated?: number;
    unlocked?: boolean;
}

export interface ApiAchievementTierDto {
    count: number;
    points?: number;
}

export interface ApiAchievementRewardDto {
    type: string;
    count?: number;
    id?: number;
    region?: string;
}

export interface ApiAchievementDto {
    id: number;
    icon?: string;
    name?: string;
    description?: string;
    requirement?: string;
    locked_text?: string;
    type?: string;
    flags?: string[];
    tiers?: ApiAchievementTierDto[];
    prerequisites?: number[];
    rewards?: ApiAchievementRewardDto[];
    bits?: AchievementBit[];
    point_cap?: number;
}

export interface ApiAchievementCategoryEntryDto {
    id: number;
    required_access?: {
        product: string;
        condition: string;
    };
    flags?: string[];
    level?: [number, number];
}

export interface ApiAchievementCategoryDto {
    id: number;
    name?: string;
    description?: string;
    order?: number;
    icon?: string;
    achievements: Array<number | ApiAchievementCategoryEntryDto>;
    tomorrow?: ApiAchievementCategoryEntryDto[];
}

export interface ApiItemStatDto {
    id: number;
    attributes?: Record<string, number>;
}

export interface ApiItemDetailsDto {
    type?: string;
    description?: string;
    [key: string]: unknown;
}

export interface ApiItemDto extends ItemTooltipData {
    id: number;
    chat_link?: string;
    type?: string;
    level?: number;
    vendor_value?: number;
    details?: ApiItemDetailsDto;
    flags?: string[];
    upgrades?: number[];
    infusions?: number[];
    binding?: 'Account' | 'Character';
    bound_to?: string;
    stats?: ApiItemStatDto;
    skin?: number;
    count?: number;
    charges?: number;
    [key: string]: unknown;
}

export interface ExpandedItem extends ApiItemDto {
    id: number;
    name: string;
    icon: string;
    rarity: string;
    count: number;
}

export interface ApiCharacterBagDto {
    id: number;
    size: number;
    inventory?: Array<ApiItemDto | null>;
}

export interface ApiCharacterCraftingDto {
    discipline?: string;
    rating?: number;
    active?: boolean;
}

export interface ApiCharacterDto {
    name: string;
    race?: string;
    gender?: string;
    profession?: string;
    level?: number;
    guild?: string;
    age?: number;
    created?: ApiIsoDate;
    deaths?: number;
    title?: number;
    crafting?: Array<ApiCharacterCraftingDto | null>;
    bags?: Array<ApiCharacterBagDto | null>;
    equipment?: Array<ApiItemDto | null>;
    [key: string]: unknown;
}

export interface ApiCurrencyDto {
    id: number;
    name: string;
    description: string;
    icon: string;
    order: number;
}

export interface ApiWalletDto {
    id: number;
    value: number;
}

export interface ApiCommercePriceOfferDto {
    unit_price: number;
    quantity: number;
}

export interface ApiCommercePriceDto {
    id: number;
    buys?: ApiCommercePriceOfferDto;
    sells?: ApiCommercePriceOfferDto;
}

export interface ApiCommerceListingTierDto {
    listings: number;
    unit_price: number;
    quantity: number;
}

export interface ApiCommerceListingsDto {
    id: number;
    buys: ApiCommerceListingTierDto[];
    sells: ApiCommerceListingTierDto[];
}

export interface ApiCommerceDeliveryDto {
    coins: number;
    items: Array<{ id: number; count: number }>;
}

export interface ApiCommerceTransactionDto {
    id: number;
    item_id: number;
    price: number;
    quantity: number;
    created: ApiIsoDate;
    purchased?: ApiIsoDate;
}

export interface ApiGuildEmblemLayerDto {
    id: number;
    colors: Array<number | { id: number }>;
}

export interface ApiGuildDto {
    id: string;
    name: string;
    tag: string;
    motd?: string;
    level?: number;
    member_count?: number;
    member_capacity?: number;
    aetherium?: number;
    favor?: number;
    emblem?: {
        background: ApiGuildEmblemLayerDto;
        foreground: ApiGuildEmblemLayerDto;
        flags?: string[];
    };
}

export interface ApiGuildStashSectionDto {
    inventory?: Array<ApiItemDto | null>;
}

export interface ApiLegendaryArmoryDto {
    id: number;
    max_count: number;
}

export interface ApiAccountLegendaryArmoryDto {
    id: number;
    count: number;
}

export interface ApiMiniDto {
    id: number;
    name: string;
    icon: string;
    order: number;
    item_id: number;
    unlock?: string;
}

export interface ApiSkinDto {
    id: number;
    name: string;
    type: string;
    flags?: string[];
    restrictions?: string[];
    icon?: string;
    rarity?: string;
    description?: string;
}

export interface WalletCurrency extends ApiCurrencyDto {
    value: number;
    active?: number;
    depreciated?: boolean;
    depreciationReason?: string;
    [key: string]: unknown;
}

export interface DeliveryData {
    coins: number;
    items: ExpandedItem[];
}

export interface TransactionCurrentItem extends ExpandedItem {
    transId: number;
    item_id: number;
    price: number;
    quantity: number;
    created: ApiIsoDate;
    count: number;
    buys?: ApiCommercePriceOfferDto;
    sells?: ApiCommercePriceOfferDto;
    outbid_quantity?: number;
}

export interface GuildStashData {
    name: string;
    stash: ExpandedItem[];
    error?: string;
}

export interface CharacterWithItems extends ApiCharacterDto {
    _items: ExpandedItem[];
}

export interface AccountWithLocalDates extends ApiAccountDto {
    created_local: string;
    last_modified_local: string;
}

export interface WizardsVaultObjective {
    id?: number;
    title: string;
    track: string;
    claimed?: boolean;
    acclaim?: number;
}

export interface WizardsVaultCategoryData {
    objectives?: WizardsVaultObjective[];
    meta_reward_claimed?: boolean;
    meta_reward_astral?: number;
    meta_progress_current?: number;
    meta_progress_complete?: number;
}

export interface LegendaryItemSummary {
    id: number;
    name: string;
    icon: string;
    description?: string;
    max_count: number;
    count: number;
    rarity?: string;
    equipped?: boolean;
}

export type LegendaryWeaponsBySubtype = Record<string, LegendaryItemSummary[]>;

export interface LegendaryArmorByWeight {
    Light: Record<string, LegendaryItemSummary[]>;
    Medium: Record<string, LegendaryItemSummary[]>;
    Heavy: Record<string, LegendaryItemSummary[]>;
}

export interface LegendaryTrinketsBySubtype {
    Accessory: LegendaryItemSummary[];
    Ring: LegendaryItemSummary[];
    Amulet: LegendaryItemSummary[];
}

export interface LegendariesData {
    armor: LegendaryArmorByWeight;
    trinkets: LegendaryTrinketsBySubtype;
    back: LegendaryItemSummary[];
    upgrades: LegendaryItemSummary[];
    weapons: LegendaryWeaponsBySubtype;
}

export const EMPTY_DELIVERY_DATA: DeliveryData = {
    coins: 0,
    items: [],
};

export const EMPTY_TRANSACTIONS_CURRENT: { buys: TransactionCurrentItem[]; sells: TransactionCurrentItem[] } = {
    buys: [],
    sells: [],
};

export const EMPTY_ACCOUNT_DATA: AccountWithLocalDates = {
    id: '',
    age: 0,
    name: '',
    world: 0,
    guilds: [],
    guild_leader: [],
    created: '',
    access: [],
    commander: false,
    fractal_level: 0,
    daily_ap: 0,
    monthly_ap: 0,
    wvw_rank: 0,
    last_modified: '',
    created_local: '',
    last_modified_local: '',
};

export const EMPTY_LEGENDARIES_DATA: LegendariesData = {
    armor: {
        Light: { Helm: [], Shoulders: [], Coat: [], Gloves: [], Leggings: [], Boots: [], HelmAquatic: [] },
        Medium: { Helm: [], Shoulders: [], Coat: [], Gloves: [], Leggings: [], Boots: [], HelmAquatic: [] },
        Heavy: { Helm: [], Shoulders: [], Coat: [], Gloves: [], Leggings: [], Boots: [], HelmAquatic: [] },
    },
    trinkets: {
        Accessory: [],
        Ring: [],
        Amulet: [],
    },
    back: [],
    upgrades: [],
    weapons: {},
};
