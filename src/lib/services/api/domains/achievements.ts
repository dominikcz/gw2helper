export function normalizeAccountAchievements<T extends { bits_done?: number[]; bits?: number[] }>(achievements: T[]): Array<T & { bits_done: number[] }> {
    return (achievements || []).map((achievement) => ({
        ...achievement,
        bits_done: Array.isArray(achievement.bits_done) ? [...achievement.bits_done] : [...(achievement.bits || [])],
    }));
}

type CategoryEntry = number | { id: number };

type CategoryLike = {
    id: number;
    name?: string;
    description?: string;
    achievements: CategoryEntry[];
};

export function normalizeAchievementCategories<T extends CategoryLike>(categories: T[]): Array<T & {
    name: string;
    description: string;
    rewards_to_get: Map<string, number>;
    points_to_get: number;
    achievements: Array<{ id: number; name: string }>;
}> {
    return categories.map((category) => ({
        ...category,
        name: category.name || '',
        description: category.description || '',
        rewards_to_get: new Map<string, number>(),
        points_to_get: 0,
        achievements: category.achievements.map((entry) => ({ id: typeof entry === 'number' ? entry : entry.id, name: '' })),
    }));
}

export function buildIgnoredAchievementIds(currentSeason: string, inactive: number[], seasonal: Record<string, number[]>): Set<number> {
    const ignoredAchievementIds = new Set(inactive);
    for (const season of Object.keys(seasonal)) {
        if (season !== currentSeason) {
            for (const id of seasonal[season] || []) {
                ignoredAchievementIds.add(id);
            }
        }
    }
    return ignoredAchievementIds;
}

type CategoryWithAchievements = {
    achievements: Array<{ id?: number } | number>;
};

export function collectUncategorizedAchievementIds(categories: CategoryWithAchievements[], allIds: number[], ignoredAchievementIds: Set<number>): number[] {
    const achievsInCategories = new Set<number>();
    categories.forEach((category) => {
        category.achievements
            .map((entry) => Number((entry as { id?: number }).id || entry || 0))
            .filter((id) => id > 0)
            .forEach((id) => achievsInCategories.add(id));
    });

    return allIds.filter((id) => !ignoredAchievementIds.has(id) && !achievsInCategories.has(id));
}
