import helperUtils from "$lib/utils/helper-utils";
import { sum } from "$lib/utils";

export function sort(collection, sortBy) {
    console.log('sorting...');
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
        default: {
            collection.sort((a, b) => {
                const order = (a.order || 0) - (b.order || 0);
                return order == 0 ? a.name.localeCompare(b.name) : order;
            });
        }
    }
    return collection;
}

export const sumRewards = (rewardsToGet, rewards) => {
    rewards.forEach(x => {
        const key = (x.region ? `${x.type}_${x.region}` : x.type).toLowerCase();
        const old = rewardsToGet.get(key) || 0;
        rewardsToGet.set(key, old + (x.count || 1))
    });
}

export function expandToDoList(all, list) {
    const _data = [];

    all.categories.forEach((cat) => {
        cat.achievements.forEach((x) => {
            if (list.includes(x.id)) {
                _data.push({ ...x, todo: true });
            }
        });
    });
    // console.log('expanded', _data)
    return _data;
}

function filterDaily(x) {
    return filterFlags(x, ['Daily']);
}

function filterWeekly(x) {
    return filterFlags(x, ['Weekly']);
}

function filterDailyWeekly(x) {
    return filterFlags(x, ['Daily', 'Weekly']);
}

function filterFlags(x, expected) {
    return x.flags.some(item => expected.includes(item));
}

function onlyActiveCategories(x) {
    // it should be done on the level of an additional layer over api, but for now just quick reset of rewards
    x.rewards_to_get.clear();
    x.points_to_get = 0;

    return !x.ignore;
}

export function extractDaily(achievements) {
    return filteredAchievements(achievements, '', filterDaily, onlyActiveCategories);
}

export function extractWeekly(achievements) {
    return filteredAchievements(achievements, '', filterWeekly, onlyActiveCategories);
}

export function extractDailyAndWeekly(achievements) {
    return filteredAchievements(achievements, '', filterDailyWeekly, onlyActiveCategories);
}

export function filteredAchievements(data, filter, callbackFn, categoriesCallbackFn, params) {
    // `params` is just for forcing Svelte to make it reactive to other params. Just add there any variables which you want Svete to react on

    console.log('filtering...');
    // clone base properties, but no categories
    let _data = {
        completed: data.completed,
        todo: data.todo,
        daily_ap: data.daily_ap,
        monthly_ap: data.monthly_ap,
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
    const _categories = categoriesCallbackFn ? data.categories.filter(categoriesCallbackFn) : params.ignoreUnavilable ? data.categories.filter((x) => !x.ignore) : data.categories;

    _data.categories = _categories.map(({ achievements, ...rest }) => {
        let _cat = { ...rest }; // (1) clone categories without achievements

        // (2) filter achievements and attach them to this cloned category
        _cat.achievements = achievements.filter(callbackFn);

        _cat.points_to_get = sum(_cat.achievements, 'points_to_get');
        _cat.points_done = sum(_cat.achievements, 'points_done');
        _cat._rewards_to_get = _cat.achievements.filter(x => !x.done && x.rewards).flatMap(x => x.rewards)
        // aggregating and mapping from array of objects to object with nested arrays of objects, group by 'type' field
        // cat.rewards = Object.groupBy(cat_rewards, x => x.type.toLowerCase())
        // cat.titles_to_get = cat.achievements.filter(x => !x.done && x.rewardsObj.title).length;
        // cat.items_to_get = cat.achievements.filter(x => !x.done && x.rewardsObj.item).length;

        _cat.rewards_to_get = new Map();
        sumRewards(_cat.rewards_to_get, _cat._rewards_to_get);
        // cat.mastery_to_get.Tyria = cat.achievements.filter(x => !x.done && x.rewardsObj.item && x.rewardsObj.item.find(y => y.region == 'Tyria')).length;

        return _cat;
    })
        // (3) and finally remove all categories that have no achievs anymore, unless category name matches filter
        .filter((cat) => cat.achievements.length || (filter != '' && helperUtils.fullTextSearch(filter, cat, ['name'])));

    return _data;
}

export const CURRENT_SEASON = '';

export const SEASONAL_ACHIEVEMENTS_CATEGORIES = {
    'sab': [
        22, // Super Adventure Box: World 1
        45, // Super Adventure Box: World 2
        46, // Super Adventure Box: Tribulation Mode
        162, // Daily Super Adventure Festival
        205, // Super Adventure Box: Nostalgia
        351, // Super Adventure Box: Quality Testing
    ],
    'db': [
        25, // Dragon Bash
        231, // Dragon Bash
        232, // Dragon Bash Feats
        233, // Daily Dragon Bash
    ],
    'lc': [
        34, // Bazaar of the Four Winds
        42, // The Queen's Gauntlet
        67, // Festival of the Four Winds
        210, // Festival of the Four Winds
        211, // Crown Pavilion
        212, // Four Winds Customs
        213, // Daily Festival of the Four Winds
        214, // Queen's Gauntlet
    ],
    'ha': [
        29, // Shadow of the Mad King
        52, // Blood and Madness
        78, // Blood and Madness
        79, // Halloween Daily
        119, // Shadow of the Mad King
        146, // Shadow of the Mad King
        191, // Halloween Rituals
        193, // Shadow of the Mad King
    ],
    'wd': [
        98, // Wintersday Daily
        197, // Wintersday Traditions
        198, // Winter's Presence
    ],
    'lny': [
        102, // Lunar New Year Dailies
        199, // Dragon Ball
        200, // New Year's Customs
        201, // Daily Lunar New Year
        202, // Lunar New Year
    ]
}

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
]

