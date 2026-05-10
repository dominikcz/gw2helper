import type { AchievementSettings } from '$lib/utils';

export interface AchievFilterState {
	notCompleted: boolean;
	withPoints: boolean;
	withMasteryCentral: boolean;
	withMasteryHoT: boolean;
	withMasteryPoF: boolean;
	withMasteryIce: boolean;
	withMasteryEoD: boolean;
	withMasterySofO: boolean;
	withMasteryJW: boolean;
	withTitles: boolean;
	withItems: boolean;
	withCoins: boolean;
	daily: boolean;
	weekly: boolean;
	sortBy: string;
}

export const defaultFilters: AchievFilterState = {
	notCompleted: true,
	withPoints: false,
	withMasteryCentral: false,
	withMasteryHoT: false,
	withMasteryPoF: false,
	withMasteryIce: false,
	withMasteryEoD: false,
	withMasterySofO: false,
	withMasteryJW: false,
	withTitles: false,
	withItems: false,
	withCoins: false,
	daily: false,
	weekly: false,
	sortBy: 'ap',
};

export function applySettings(filters: AchievFilterState, settings: AchievementSettings): void {
	(Object.keys(settings) as (keyof AchievementSettings)[]).forEach((key) => {
		if (settings[key] !== undefined && key in filters) {
			(filters as Record<string, unknown>)[key] = settings[key];
		}
	});
}
