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
    // `params` is just for forcing Svelte to make it reactive to other params. Just end there any variables for which you want Svete to react

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

