import helperUtils from "$lib/utils/helper-utils";

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

export function filteredAchieves(data, filter, callbackFn, categoriesCallbackFn, params) {
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
    const _categories = categoriesCallbackFn ? data.categories.filter(categoriesCallbackFn) : data.categories.filter((x) => !x.ignore);
    _data.categories = _categories.map(({ achievements, ...rest }) => {
        let _cat = { ...rest }; // (1) clone categories without achieves
        if (_categories.id == 346) {
            console.log('_cat', _cat)
        }

        // (2) filter achieves and attach them to this cloned category
        _cat.achievements = achievements.filter(callbackFn);
        return _cat;
    })
        // (3) and finally remove all categories that have no achievs anymore, unless category name matches filter
        .filter((cat) => cat.achievements.length || (filter != '' && helperUtils.fullTextSearch(filter, cat, ['name'])));

    return _data;
}

export const CURRENT_SEASON = '';

export const SEASONAL_ACHIEVES_CATEGORIES = {
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

export const INACTIVE_ACHIEVES_CATEGORIES = [
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

