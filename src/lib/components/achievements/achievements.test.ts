import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render } from '@testing-library/svelte';
import AchievementProgress from '$lib/components/achievements/achievementProgress.svelte';
import AchievementRewards from '$lib/components/achievements/achievementRewards.svelte';
import Achievement from '$lib/components/achievements/achievement.svelte';

afterEach(() => {
	cleanup();
});

// ---------------------------------------------------------------------------
// achievementProgress
// ---------------------------------------------------------------------------

describe('achievementProgress', () => {
	it('renders default text progress with done states by index', () => {
		const { getByText, container } = render(AchievementProgress, {
			props: { type: 'Default', bits: [{ text: 'Step A' }, { text: 'Step B' }], bitsDone: [1] },
		});
		expect(getByText('Step A')).toBeInTheDocument();
		expect(getByText('Step B')).toBeInTheDocument();
		expect(container.querySelector('li.done')).toBeInTheDocument();
	});

	it('marks default text progress as done by bit id', () => {
		const { getByText, container } = render(AchievementProgress, {
			props: {
				type: 'Default',
				bits: [{ id: 501, text: 'Collect relic' }, { id: 502, text: 'Return relic' }],
				bitsDone: [501],
			},
		});
		expect(getByText('Collect relic')).toBeInTheDocument();
		expect(container.querySelector('li.done')).toBeInTheDocument();
	});

	it('renders empty list when bits is empty', () => {
		const { container } = render(AchievementProgress, { props: { type: 'Default', bits: [], bitsDone: [] } });
		expect(container.querySelector('ol')).toBeInTheDocument();
		expect(container.querySelector('li')).not.toBeInTheDocument();
	});

	it('renders nothing recognizable for unknown type', () => {
		const { queryByText } = render(AchievementProgress, {
			props: { type: 'Unknown', bits: [{ text: 'X' }], bitsDone: [] },
		});
		expect(queryByText('X')).not.toBeInTheDocument();
	});

	it('renders item set icons and fallback for missing entries', () => {
		const itemsCache = (id: number) => (id === 1001 ? { name: 'Apple', icon: 'https://example.com/apple.png' } : {});
		const { container } = render(AchievementProgress, {
			props: {
				type: 'ItemSet',
				bits: [{ id: 1001, type: 'Item' }, { id: 1002, type: 'Item' }],
				bitsDone: [0],
				itemsCache,
			},
		});
		expect(container.querySelector('img[src="https://example.com/apple.png"]')).toBeInTheDocument();
		expect(container.querySelector('.done')).toBeInTheDocument();
		expect(container.querySelector('img[alt*="not found"]')).toBeInTheDocument();
	});

	it('all bits marked done when done=true — _bitsDone equals bits length', () => {
		const { container } = render(AchievementRewards, {
			props: { type: 'ItemSet', bits: ['a', 'b'], bitsDone: [], done: true, pointsToGet: 0 },
		});
		// done=true: _bitsDone = bits.length = 2; check "2 / 2" rendered
		expect(container).toHaveTextContent('2');
	});

	it('renders detailed item set with text labels', () => {
		const itemsCache = (id: number) => (id === 1001 ? { name: 'Apple', icon: 'https://example.com/apple.png' } : {});
		const { container, getByText } = render(AchievementProgress, {
			props: {
				type: 'ItemSet',
				detailed: true,
				bits: [{ id: 1001, type: 'Item' }, { id: 1002, type: 'Item', text: 'Missing item' }],
				itemsCache,
			},
		});
		expect(container.querySelector('.item-set-detailed')).toBeInTheDocument();
		expect(getByText('Apple')).toBeInTheDocument();
		expect(getByText('Missing item')).toBeInTheDocument();
	});

	it('renders Minipet bits via minisCache', () => {
		const minisCache = (id: number) => (id === 5 ? { name: 'Mini Quaggan', icon: 'quaggan.png' } : {});
		const { container } = render(AchievementProgress, {
			props: { type: 'ItemSet', bits: [{ id: 5, type: 'Minipet' }], bitsDone: [], minisCache },
		});
		expect(container.querySelector('img[src="quaggan.png"]')).toBeInTheDocument();
	});

	it('renders Skin bits via skinsCache', () => {
		const skinsCache = (id: number) => (id === 9 ? { name: 'Dragon Skin', icon: 'skin.png' } : {});
		const { container } = render(AchievementProgress, {
			props: { type: 'ItemSet', bits: [{ id: 9, type: 'Skin' }], bitsDone: [], skinsCache },
		});
		expect(container.querySelector('img[src="skin.png"]')).toBeInTheDocument();
	});
});

// ---------------------------------------------------------------------------
// achievementRewards
// ---------------------------------------------------------------------------

describe('achievementRewards', () => {
	it('renders nothing reward-specific when rewardsObj is empty', () => {
		const { container } = render(AchievementRewards, { props: { type: 'Default', rewardsObj: {} } });
		expect(container.querySelector('img[src*="Title_icon"]')).not.toBeInTheDocument();
		expect(container.querySelector('img[src*="Achievement_Chest"]')).not.toBeInTheDocument();
	});

	it('shows collection icon for ItemSet type', () => {
		const { container } = render(AchievementRewards, { props: { type: 'ItemSet', rewardsObj: {} } });
		expect(container.querySelector('img[src*="Talk_collection_option"]')).toBeInTheDocument();
	});

	it('shows title icon when rewardsObj.title is set', () => {
		const { container } = render(AchievementRewards, { props: { type: 'Default', rewardsObj: { title: true } } });
		expect(container.querySelector('img[src*="Title_icon"]')).toBeInTheDocument();
	});

	it('shows item icon when rewardsObj.item is set', () => {
		const { container } = render(AchievementRewards, { props: { type: 'Default', rewardsObj: { item: true } } });
		expect(container.querySelector('img[src*="Achievement_Chest"]')).toBeInTheDocument();
	});

	it('shows price when rewardsObj.coins is set', () => {
		const { container } = render(AchievementRewards, {
			props: { type: 'Default', rewardsObj: { coins: [{ count: 10000 }] } },
		});
		expect(container.querySelector('.price')).toBeInTheDocument();
	});

	it('shows Central Tyria mastery icon', () => {
		const { container } = render(AchievementRewards, {
			props: { type: 'Default', rewardsObj: { mastery: [{ region: 'Tyria' }] } },
		});
		expect(container.querySelector('img[src*="Mastery_point_Central_Tyria"]')).toBeInTheDocument();
	});

	it('shows Heart of Thorns mastery icon', () => {
		const { container } = render(AchievementRewards, {
			props: { type: 'Default', rewardsObj: { mastery: [{ region: 'Maguuma' }] } },
		});
		expect(container.querySelector('img[src*="Mastery_point_Heart_of_Thorns"]')).toBeInTheDocument();
	});

	it('shows Path of Fire mastery icon', () => {
		const { container } = render(AchievementRewards, {
			props: { type: 'Default', rewardsObj: { mastery: [{ region: 'Desert' }] } },
		});
		expect(container.querySelector('img[src*="Mastery_point_Path_of_Fire"]')).toBeInTheDocument();
	});

	it('shows End of Dragons mastery icon', () => {
		const { container } = render(AchievementRewards, {
			props: { type: 'Default', rewardsObj: { mastery: [{ region: 'Jade' }] } },
		});
		expect(container.querySelector('img[src*="Mastery_point_End_of_Dragons"]')).toBeInTheDocument();
	});

	it('shows bits progress bar counts', () => {
		const { container } = render(AchievementRewards, {
			props: { type: 'Default', bits: [1, 2, 3], bitsDone: [1], pointsToGet: 0 },
		});
		expect(container).toHaveTextContent('1');
		expect(container).toHaveTextContent('3');
	});

	it('shows pointsToGet when > 0', () => {
		const { container } = render(AchievementRewards, {
			props: { type: 'Default', rewardsObj: {}, pointsToGet: 25 },
		});
		expect(container.querySelector('img[src*="AP.png"]')).toBeInTheDocument();
	});

	it('does not show AP icon when pointsToGet is 0', () => {
		const { container } = render(AchievementRewards, {
			props: { type: 'Default', rewardsObj: {}, pointsToGet: 0 },
		});
		expect(container.querySelector('img[src*="AP.png"]')).not.toBeInTheDocument();
	});

	it('multiple reward types coexist', () => {
		const { container } = render(AchievementRewards, {
			props: {
				type: 'Default',
				rewardsObj: { title: true, item: true, mastery: [{ region: 'Tyria' }] },
				pointsToGet: 10,
			},
		});
		expect(container.querySelector('img[src*="Title_icon"]')).toBeInTheDocument();
		expect(container.querySelector('img[src*="Achievement_Chest"]')).toBeInTheDocument();
		expect(container.querySelector('img[src*="Mastery_point_Central_Tyria"]')).toBeInTheDocument();
		expect(container.querySelector('img[src*="AP.png"]')).toBeInTheDocument();
	});
});

// ---------------------------------------------------------------------------
// achievement (card component)
// ---------------------------------------------------------------------------

describe('achievement', () => {
	const baseProps = { id: 42, name: 'Test Achievement' };

	it('renders achievement name', () => {
		const { getByText } = render(Achievement, { props: baseProps });
		expect(getByText('Test Achievement')).toBeInTheDocument();
	});

	it('renders description when provided', () => {
		const { getByText } = render(Achievement, { props: { ...baseProps, description: 'Defeat 10 enemies.' } });
		expect(getByText('Defeat 10 enemies.')).toBeInTheDocument();
	});

	it('does not render description span when absent', () => {
		const { queryByText } = render(Achievement, { props: baseProps });
		expect(queryByText('Defeat 10 enemies.')).not.toBeInTheDocument();
	});

	it('renders requirement when provided', () => {
		const { getByText } = render(Achievement, { props: { ...baseProps, requirement: 'Must be level 80.' } });
		expect(getByText('Must be level 80.')).toBeInTheDocument();
	});

	it('renders progress bar when max is set', () => {
		const { container } = render(Achievement, { props: { ...baseProps, current: 3, max: 10 } });
		expect(container.querySelector('progress')).toBeInTheDocument();
		expect(container).toHaveTextContent('3 / 10');
	});

	it('does not render progress bar when max is absent', () => {
		const { container } = render(Achievement, { props: baseProps });
		expect(container.querySelector('progress')).not.toBeInTheDocument();
	});

	it('caps progress display at max', () => {
		const { container } = render(Achievement, { props: { ...baseProps, current: 15, max: 10 } });
		expect(container).toHaveTextContent('10 / 10');
	});

	it('renders icon image when icon is provided', () => {
		const { container } = render(Achievement, { props: { ...baseProps, icon: '/icons/foo.png' } });
		expect(container.querySelector('img[src="/icons/foo.png"]')).toBeInTheDocument();
	});

	it('renders detail link pointing to /achievements/42/', () => {
		const { container } = render(Achievement, { props: baseProps });
		expect(container.querySelector('a[href*="achievements/42/"]')).toBeInTheDocument();
	});

	it('has done class when done=true', () => {
		const { container } = render(Achievement, { props: { ...baseProps, done: true } });
		expect(container.querySelector('.achiev')).toHaveClass('done');
	});

	it('does not have done class when done=false', () => {
		const { container } = render(Achievement, { props: { ...baseProps, done: false } });
		expect(container.querySelector('.achiev')).not.toHaveClass('done');
	});

	it('renders title reward icon', () => {
		const { container } = render(Achievement, { props: { ...baseProps, rewardsObj: { title: true } } });
		expect(container.querySelector('img[src*="Title_icon"]')).toBeInTheDocument();
	});

	it('renders item reward icon', () => {
		const { container } = render(Achievement, { props: { ...baseProps, rewardsObj: { item: true } } });
		expect(container.querySelector('img[src*="Achievement_Chest"]')).toBeInTheDocument();
	});

	it('renders AP icon when pointsToGet > 0', () => {
		const { container } = render(Achievement, { props: { ...baseProps, pointsToGet: 5 } });
		expect(container.querySelector('img[src*="AP.png"]')).toBeInTheDocument();
	});

	it('renders tiers count in rewards via bits length', () => {
		const { container } = render(Achievement, {
			props: { ...baseProps, bits: ['a', 'b', 'c'], bitsDone: [0] },
		});
		expect(container).toHaveTextContent('1');
		expect(container).toHaveTextContent('3');
	});

	it('renders Hidden flag icon', () => {
		const { container } = render(Achievement, { props: { ...baseProps, flags: ['Hidden'] } });
		expect(container.querySelector('img[src*="Achievements_Watch_List"]')).toBeInTheDocument();
	});

	it('does not render Hidden flag icon when not hidden', () => {
		const { container } = render(Achievement, { props: { ...baseProps, flags: [] } });
		expect(container.querySelector('img[src*="Achievements_Watch_List"]')).not.toBeInTheDocument();
	});
});
