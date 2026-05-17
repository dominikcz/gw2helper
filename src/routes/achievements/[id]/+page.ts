export const ssr = false;

import type { PageLoad } from './$types';
import type { AchievementBit } from '$lib/types/achievements';
import type { AchievementLike, AchievementsData, CategoryLike } from '$lib/components/achievements/achievements';

type AchievementsView = AchievementsData & { rewards_to_get: Map<string, number> };

type PrerequisiteInfo = {
	id: number;
	name?: string;
	done?: boolean;
};

type RewardItemInfo = {
	id: number;
	name?: string;
	icon?: string;
	rarity?: string;
};

type RewardTitleInfo = {
	id: number;
	name?: string;
};

type AchievementDetails = {
	achievement: AchievementLike | null;
	category: CategoryLike | null;
	isTodo: boolean;
	prerequisites: PrerequisiteInfo[];
	rewardItemIds: number[];
	rewardTitleIds: number[];
	rewardItems: RewardItemInfo[];
	rewardTitles: RewardTitleInfo[];
	apiLang?: string;
};

export const load: PageLoad = async ({ parent, params, fetch }) => {
	const { apiService, toDoList, apiLang } = (await parent()) as {
		apiService: {
			getApiKey: () => string;
			achievements: (all?: boolean) => Promise<AchievementsView>;
			hydrateAchievementBits: (bits: AchievementBit[]) => Promise<void>;
			items: (ids: string) => Promise<Array<{ id: number; name?: string; icon?: string; rarity?: string }>>;
		};
		toDoList: Promise<number[]>;
		apiLang?: string;
	};
	const achievId = Number(params.id);
	const todo = await toDoList;

	if (!apiService.getApiKey() || !Number.isFinite(achievId) || achievId <= 0) {
		const empty: AchievementDetails = {
			achievement: null,
			category: null,
			isTodo: false,
			prerequisites: [],
			rewardItemIds: [],
			rewardTitleIds: [],
			rewardItems: [],
			rewardTitles: [],
			apiLang,
		};
		return empty;
	}

	const data = (await apiService.achievements(false)) as AchievementsView;
	let foundAchievement: AchievementLike | null = null;
	let foundCategory: CategoryLike | null = null;

	for (const category of data.categories || []) {
		const achievement = (category.achievements || []).find((x) => Number(x.id) === achievId) || null;
		if (achievement) {
			foundAchievement = achievement;
			foundCategory = category;
			break;
		}
	}

	if (foundAchievement?.bits) {
		await apiService.hydrateAchievementBits(foundAchievement.bits as AchievementBit[]);
	}

	const achievementsById = new Map<number, { name?: string; done?: boolean }>();
	for (const category of data.categories || []) {
		for (const achievement of category.achievements || []) {
			const id = Number(achievement.id);
			if (id > 0) {
				achievementsById.set(id, {
					name: achievement.name ? String(achievement.name) : undefined,
					done: Boolean((achievement as { done?: boolean }).done),
				});
			}
		}
	}

	const rawPrerequisites = Array.isArray((foundAchievement as { prerequisites?: number[] } | null)?.prerequisites)
		? (((foundAchievement as { prerequisites?: number[] }).prerequisites || []) as number[])
		: [];
	const prerequisites: PrerequisiteInfo[] = rawPrerequisites
		.map((id) => Number(id))
		.filter((id) => Number.isFinite(id) && id > 0)
		.map((id) => ({
			id,
			name: achievementsById.get(id)?.name,
			done: achievementsById.get(id)?.done,
		}));

	const rawRewards = Array.isArray((foundAchievement as { rewards?: Array<{ type?: string; id?: number }> } | null)?.rewards)
		? (((foundAchievement as { rewards?: Array<{ type?: string; id?: number }> }).rewards || []))
		: [];
	const rewardItemIds = [...new Set(rawRewards
		.filter((r) => r?.type === 'Item' && r?.id != null)
		.map((r) => Number(r.id))
		.filter((id) => Number.isFinite(id) && id > 0))];
	const rewardTitleIds = [...new Set(rawRewards
		.filter((r) => r?.type === 'Title' && r?.id != null)
		.map((r) => Number(r.id))
		.filter((id) => Number.isFinite(id) && id > 0))];

	const result: AchievementDetails = {
		achievement: foundAchievement,
		category: foundCategory,
		isTodo: todo.includes(achievId),
		prerequisites,
		rewardItemIds,
		rewardTitleIds,
		rewardItems: [],
		rewardTitles: [],
		apiLang,
	};

	return result;
};
