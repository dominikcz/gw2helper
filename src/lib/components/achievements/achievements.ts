import helperUtils from "$lib/utils/helper-utils";
import { sum } from "$lib/utils";

type SortBy = 'ap' | 'name' | 'order' | 'progress' | string;

type RewardLike = {
    type: string;
    region?: string;
    count?: number;
};

export type AchievementLike = {
    id?: number;
    icon?: string;
    name: string;
    type?: string;
    description?: string;
    requirement?: string;
    current?: number;
    max?: number;
    done?: boolean;
    todo?: boolean;
    order?: number;
    points_to_get?: number;
    points_done?: number;
    rewards?: RewardLike[];
    bits?: unknown[];
    bits_done?: number[];
    rewardsObj?: Record<string, unknown>;
    flags?: string[];
    [key: string]: unknown;
};

export type CategoryLike = {
    id?: number;
    icon?: string;
    name: string;
    description?: string;
    ignore?: boolean;
    achievements: AchievementLike[];
    rewards_to_get: Map<string, number>;
    points_to_get: number;
    points_done?: number;
    _rewards_to_get?: RewardLike[];
    [key: string]: unknown;
};

export type AchievementsData = {
    completed: number;
    todo: number;
    daily_ap: number;
    monthly_ap: number;
    categories: CategoryLike[];
    [key: string]: unknown;
};

type FilterParams = {
    ignoreUnavilable?: boolean;
    [key: string]: unknown;
};

type AchievementPredicate = (item: AchievementLike) => boolean;
type CategoryPredicate = ((category: CategoryLike) => boolean) | null;

type Sortable = {
    name: string;
    order?: number;
    done?: boolean;
    points_to_get?: number;
    current?: number;
    max?: number;
    bits?: unknown[];
    bits_done?: number[];
};

function progressValue(item: Sortable): number {
    const max = Number(item.max ?? 0);
    const current = Number(item.current ?? 0);
    if (max > 0) {
        return Math.min(Math.max(current / max, 0), 1);
    }

    const bits = Array.isArray(item.bits) ? item.bits.length : 0;
    const bitsDone = Array.isArray(item.bits_done) ? item.bits_done.length : 0;
    if (bits > 0) {
        return Math.min(Math.max(bitsDone / bits, 0), 1);
    }

    return item.done ? 1 : 0;
}

export function sort(collection: AchievementLike[], sortBy: SortBy): AchievementLike[];
export function sort(collection: CategoryLike[], sortBy: SortBy): CategoryLike[];
export function sort<T extends Sortable>(collection: T[], sortBy: SortBy): T[] {
    switch (sortBy) {
        case 'ap': {
            collection.sort((a, b) => {
                // done at the end, no matter how many points
                const _a = (a.done ? -10000 : 0) + (a.points_to_get || 0);
                const _b = (b.done ? -10000 : 0) + (b.points_to_get || 0);
                return _b - _a; //desc
            });
            break;
        }
        case 'name': {
            collection.sort((a, b) => {
                return a.name.localeCompare(b.name);
            });
            break;
        }
        case 'progress': {
            collection.sort((a, b) => {
                const p = progressValue(b) - progressValue(a);
                if (p !== 0) {
                    return p;
                }
                const ap = (b.points_to_get || 0) - (a.points_to_get || 0);
                return ap !== 0 ? ap : a.name.localeCompare(b.name);
            });
            break;
        }
        default: {
            collection.sort((a, b) => {
                const order = (a.order || 0) - (b.order || 0);
                return order == 0 ? a.name.localeCompare(b.name) : order;
            });
        }
    }
    return collection;
}

export const sumRewards = (rewardsToGet: Map<string, number>, rewards: RewardLike[]): void => {
    rewards.forEach((x) => {
        const key = (x.region ? `${x.type}_${x.region}` : x.type).toLowerCase();
        const old = rewardsToGet.get(key) || 0;
        rewardsToGet.set(key, old + (x.count || 1));
    });
};

export function expandToDoList(all: AchievementsData, list: number[]): AchievementLike[] {
    const _data: AchievementLike[] = [];
    const todoIds = new Set(list);

    all.categories.forEach((cat) => {
        cat.achievements.forEach((x) => {
            if (x.id !== undefined && todoIds.has(x.id)) {
                _data.push({ ...x, todo: true });
            }
        });
    });
    // console.log('expanded', _data)
    return _data;
}

function filterDaily(x: AchievementLike): boolean {
    return filterFlags(x, ['Daily']);
}

function filterWeekly(x: AchievementLike): boolean {
    return filterFlags(x, ['Weekly']);
}

function filterDailyWeekly(x: AchievementLike): boolean {
    return filterFlags(x, ['Daily', 'Weekly']);
}

function filterFlags(x: { flags?: string[] }, expected: string[]): boolean {
    return (x.flags || []).some((item) => expected.includes(item));
}

function onlyActiveCategories(x: CategoryLike): boolean {
    // it should be done on the level of an additional layer over api, but for now just quick reset of rewards
    x.rewards_to_get.clear();
    x.points_to_get = 0;

    return !x.ignore;
}

export function extractDaily(achievements: AchievementsData): AchievementsData {
    return filteredAchievements(achievements, '', filterDaily, onlyActiveCategories);
}

export function extractWeekly(achievements: AchievementsData): AchievementsData {
    return filteredAchievements(achievements, '', filterWeekly, onlyActiveCategories);
}

export function extractDailyAndWeekly(achievements: AchievementsData): AchievementsData {
    return filteredAchievements(achievements, '', filterDailyWeekly, onlyActiveCategories);
}

export function filteredAchievements(
    data: AchievementsData,
    filter: string,
    callbackFn: AchievementPredicate,
    categoriesCallbackFn: CategoryPredicate,
    params: FilterParams = {}
): AchievementsData {
    // `params` is just for forcing Svelte to make it reactive to other params. Add extra variables there to opt-in to reactivity.

    // clone base properties, but no categories
    const _data: AchievementsData = {
        completed: data.completed,
        todo: data.todo,
        daily_ap: data.daily_ap,
        monthly_ap: data.monthly_ap,
        categories: [],
    };

    // in order to accomplish this task we have to produce a clone of this hierarchical structure and work on it,
    // since we cannot modify original
    // simplified structure:
    // - data
    //   |- some properties
    //   |...
    //   |- categories (1) (3)
    //      |- some properties
    //      |- achievements (2)
    //         |- name, description, requirements - we filter here
    //         |- masteries
    //            |- [] we filter here too

    // new categories (1)
    const _categories = categoriesCallbackFn
        ? data.categories.filter(categoriesCallbackFn)
        : params?.ignoreUnavilable
            ? data.categories.filter((x) => !x.ignore)
            : data.categories;

    _data.categories = _categories
        .map(({ achievements, ...rest }) => {
            const _cat: CategoryLike = {
                ...(rest as CategoryLike),
                achievements: [],
                rewards_to_get: new Map<string, number>(),
                points_to_get: 0,
            }; // (1) clone categories without achievements

            // (2) filter achievements and attach them to this cloned category
            _cat.achievements = achievements.filter(callbackFn);

            _cat.points_to_get = sum(_cat.achievements, 'points_to_get');
            _cat.points_done = sum(_cat.achievements, 'points_done');
            _cat._rewards_to_get = _cat.achievements
                .filter((x) => !x.done && Array.isArray(x.rewards))
                .flatMap((x) => x.rewards as RewardLike[]);
            // aggregating and mapping from array of objects to object with nested arrays of objects, group by 'type' field
            // cat.rewards = Object.groupBy(cat_rewards, x => x.type.toLowerCase())
            // cat.titles_to_get = cat.achievements.filter(x => !x.done && x.rewardsObj.title).length;
            // cat.items_to_get = cat.achievements.filter(x => !x.done && x.rewardsObj.item).length;

            _cat.rewards_to_get = new Map<string, number>();
            sumRewards(_cat.rewards_to_get, _cat._rewards_to_get);
            // cat.mastery_to_get.Tyria = cat.achievements.filter(x => !x.done && x.rewardsObj.item && x.rewardsObj.item.find(y => y.region == 'Tyria')).length;

            return _cat;
        })
        // (3) and finally remove all categories that have no achievs anymore, unless category name matches filter
        .filter((cat) => cat.achievements.length || (filter != '' && helperUtils.fullTextSearch(filter, cat, ['name'])));

    return _data;
}

export const SEASONAL_ACHIEVEMENTS_CATEGORIES: Record<string, number[]> = {
    'sab': [ // Super Adventure Box
        22, // Super Adventure Box: World 1
        45, // Super Adventure Box: World 2
        46, // Super Adventure Box: Tribulation Mode
        162, // Daily Super Adventure Festival
        205, // Super Adventure Box: Nostalgia
        351, // Super Adventure Box: Quality Testing
    ],
    'db': [ // Dragon Bash
        25, // Dragon Bash
        231, // Dragon Bash
        232, // Dragon Bash Feats
        233, // Daily Dragon Bash
    ],
    'lc': [ // Labyrinthine Cliffs
        34, // Bazaar of the Four Winds
        42, // The Queen's Gauntlet
        67, // Festival of the Four Winds
        210, // Festival of the Four Winds
        211, // Crown Pavilion
        212, // Four Winds Customs
        213, // Daily Festival of the Four Winds
        214, // Queen's Gauntlet
    ],
    'ha': [ // Halloween
        29, // Shadow of the Mad King
        52, // Blood and Madness
        78, // Blood and Madness
        79, // Halloween Daily
        119, // Shadow of the Mad King
        146, // Shadow of the Mad King
        191, // Halloween Rituals
        193, // Shadow of the Mad King
    ],
    'wd': [ // Wintersday
        98, // Wintersday Daily
        197, // Wintersday Traditions
        198, // Winter's Presence
    ],
    'lny': [ // Lunar New Year
        102, // Lunar New Year Dailies
        199, // Dragon Ball
        200, // New Year's Customs
        201, // Daily Lunar New Year
        202, // Lunar New Year
    ],
    'fool': [
        413, // Heights of Glory
        447, // Cozy Café
        448, // Daily Fooling
    ]
};

export const INACTIVE_ACHIEVEMENTS_CATEGORIES = [
    28, // A Very Merry Wintersday '12
    36, // Support Ellen Kiel
    37, // Support Evon Gnashblade
    41, // Queen Jennah's Jubilee
    48, // Boss Week
    49, // World vs. World Season 1
    57, // A Very Merry Wintersday '13
    66, // WvW Spring Tournament 2014
    73, // Retired Achievements
    74, // WvW Fall Tournament 2014
    99, // A Very Merry Wintersday '14
    101, // Seasonal Activities
    131, // A Very Merry Wintersday '15
    132, // Lunar New Year 2016
    151, // Lunar New Year 2017
    228, // Boss Rush
    230, // Historical PvP Achievements
    256, // Meta-Event Rush
    257, // Champion Rush
    260, // Fractal Rush
    262, // Marshaling the Crystal Bloom
    263, // Marshaling the Ebon Vanguard
    265, // Mobilization Global Rewards
    267, // Marshaling the Deldrimor Dwarves
    268, // Mobilization Global Rewards
    270, // Mobilization Global Rewards
    271, // Mobilization Global Rewards
    272, // Marshaling the Tengu
    273, // Mobilization Global Rewards
    274, // Marshaling the Exalted
    275, // Mobilization Global Rewards
    276, // Mobilization Global Rewards
    277, // Marshaling the Flame Legion
    278, // Marshaling the Olmakhan
    279, // Mobilization Global Rewards
    280, // Marshaling the Skritt
    281, // Mobilization Global Rewards
    282, // Marshaling the Kodan
    342, // Extra Life Donation Drive
    372, // Black Lion Stolen Goods Recovery Event
    386, // Dungeon Rush
    392, // Dungeon Rush
    393, // Fractal Rush
    400, // Player vs. Player Rush
    401, // World vs. World Rush
    402, // New Hero Jump Start
];

export const ACHIEVEMENT_LINKS: Record<number, string> = {
    4181: `Sunken_Treasure_Hunter#achievement4181`, // Daily Blood in the Water
    4474: `Roller_Beetle_Time_Trial:_Lakeside_Loop`, // Daily Racer: Lakeside Loop
    4475: `Roller_Beetle_Time_Trial:_Tropic_Valley_Raceway`, // Daily Racer: Tropic Valley Raceway
    4478: `Roller_Beetle_Time_Trial:_Infernal_Leap`, // Daily Racer: Infernal Leap
    4480: `Roller_Beetle_Time_Trial:_Ghostfire_Run`, // Daily Racer: Ghostfire Run
    4482: `Mount_race#Roller_beetle_races`, // Daily Rolling Racer
    4484: `Roller_Beetle_Time_Trial:_Jormag's_Fang`, // Daily Racer: Jormag's Fang
    6683: `Defeat_the_invading_minions_of_Scarlet_Briar`, // Daily Portal Closer
};