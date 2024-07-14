<script>
	import helperUtils from '$lib/utils/helper-utils';
	import SearchInput from '$lib/components/searchInput.svelte';
	import Awaiter from '$lib/components/awaiter.svelte';
	import WidgetInfo from '$lib/components/widgetInfo.svelte';
	import WidgetsGroup from '$lib/components/widgetsGroup.svelte';
	import { sum } from '$lib/utils';
	import utils from '$lib/utils';
	import { base } from '$app/paths';
	import Price from '$lib/components/price.svelte';
	import { onMount } from 'svelte';
	import { Tabs, TabPanel, Tab } from '$lib/components/tabs/tabs.js';
	import AchievList from '$lib/components/achievements/achievList.svelte';

	export let data;

	let filter = '';
	let todoList = [];

	const fields = ['name', 'category', 'description'];

	let notCompleted = true;
	let withPoints = false;
	let withMasteryCentral = false;
	let withMasteryHoT = false;
	let withMasteryPoF = false;
	let withMasteryIce = false;
	let withMasteryEoD = false;
	let withMasterySofO = false;
	let withTitles = false;
	let withItems = false;
	let withCoins = false;
	let sortBy = 'ap';

	onMount(async () => {
		const settings = await data.settings;
		if (settings.notCompleted !== undefined) notCompleted = settings.notCompleted;
		if (settings.withPoints !== undefined) withPoints = settings.withPoints;
		if (settings.withMasteryCentral !== undefined) withMasteryCentral = settings.withMasteryCentral;
		if (settings.withMasteryHoT !== undefined) withMasteryHoT = settings.withMasteryHoT;
		if (settings.withMasteryPoF !== undefined) withMasteryPoF = settings.withMasteryPoF;
		if (settings.withMasteryIce !== undefined) withMasteryIce = settings.withMasteryIce;
		if (settings.withMasteryEoD !== undefined) withMasteryEoD = settings.withMasteryEoD;
		if (settings.withMasterySofO !== undefined) withMasterySofO = settings.withMasterySofO;
		if (settings.withTitles !== undefined) withTitles = settings.withTitles;
		if (settings.withItems !== undefined) withItems = settings.withItems;
		if (settings.withCoins !== undefined) withCoins = settings.withCoins;
		if (settings.sortBy !== undefined) sortBy = settings.sortBy;

		todoList = await data.todo;
		// console.log('todo', todoList);
	});

	function achievFilterCallback(achiev) {
		const mastery = achiev.rewardsObj.mastery || [];
		const notCompletedOK = !notCompleted || !achiev.done;
		const withPointsOK = !withPoints || achiev.points_to_get > 0;
		const withTitlesOK = !withTitles || achiev.rewardsObj.title;
		const withItemsOK = !withItems || achiev.rewardsObj.item;
		const withCoinsOK = !withCoins || achiev.rewardsObj.coins;
		const requiredRegions = [];
		if (withMasteryCentral) requiredRegions.push('Tyria');
		if (withMasteryHoT) requiredRegions.push('Maguuma');
		if (withMasteryPoF) requiredRegions.push('Desert');
		if (withMasteryIce) requiredRegions.push('Tundra');
		if (withMasteryEoD) requiredRegions.push('Jade');
		if (withMasterySofO) requiredRegions.push('Sky');

		const withMasteryOK = !requiredRegions.length || mastery.find((x) => requiredRegions.includes(x.region));

		const filterOK = helperUtils.fullTextSearch(filter, achiev, ['name', 'desription', 'requirement']);

		const achiev_res = notCompletedOK && withPointsOK && withTitlesOK && withItemsOK && withCoinsOK && withMasteryOK && filterOK;

		// if (item.id == 75) {
		// 	console.log(`  ${achiev.name}`, { achiev_res, notCompletedOK, withPointsOK, withMasteryOK, filterOK });
		// }
		return achiev_res;
	}

	function saveSettings() {
		utils.saveAchievesSettings({
			notCompleted,
			withPoints,
			withMasteryCentral,
			withMasteryHoT,
			withMasteryPoF,
			withMasteryIce,
			withMasteryEoD,
			withMasterySofO,
			withTitles,
			withItems,
			withCoins,
			sortBy,
		});
	}

	function filteredAchieves(data, params) {
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
		_data.categories = data.categories
			.map(({ achievements, ...rest }) => {
				let _cat = { ...rest }; // (1) clone categories without achievs
				// (2) filter achieves and attach them to this cloned category
				_cat.achievements = achievements.filter(achievFilterCallback);
				return _cat;
			})
			// (3) and finally remove all categories that have no achievs anymore
			.filter((cat) => cat.achievements.length);

		return _data;
	}

	function sort(collection, sortBy) {
		console.log('sorting...');
		switch (sortBy) {
			case 'ap': {
				collection.sort((a, b) => {
					// done at the end, no matter how many points
					const _a = (a.done ? -10000 : 0) + (a.points_to_get | 0); 
					const _b = (b.done ? -10000 : 0) + (b.points_to_get | 0);
					return (_b - _a); //desc
				});
				break;
			}
			default: {
				collection.sort((a, b) => {
					return a.name.localeCompare(b.name);
				});
			}
		}
		return collection;
	}

	async function hndToggleTodo(event) {
		const obj = event.detail;
		if (obj.todo) {
			todoList.push(obj.id);
			todoList = todoList;
		} else {
			todoList = todoList.filter((x) => x !== obj.id);
		}
		await utils.saveAchievesToDo(todoList);
	}

	function expandToDoList(all, list) {
		const api = data.apiService;
		const _data = [];

		all.categories.forEach(cat => {
			cat.achievements.forEach(x => {
				if (list.includes(x.id)) {
					_data.push({...x, todo: true});
				}
			})
		});
		// console.log('expanded', _data)
		return _data;
	}
</script>

<img src="/gw2helper/assets/150px-construction.png" title="Under constrution" width="150px" alt="under construction" />

<h1>Achievements</h1>

<Awaiter promise={data.achievements} let:result>
	{@const _result = filteredAchieves(result, [
		notCompleted,
		withPoints,
		withMasteryCentral,
		withMasteryHoT,
		withMasteryPoF,
		withMasteryIce,
		withMasteryEoD,
		withMasterySofO,
		withTitles,
		withItems,
		withCoins,
		filter,
	])}
	<WidgetsGroup name="Achievements' completed">
		<WidgetInfo title="Achieves completed" value={result.completed} image={`${base}/assets/rewards/Monthly_Achievement.png`} />
		<WidgetInfo title="Daily points" value={result.daily_ap} image={`${base}/assets/rewards/AP.png`} />
		<WidgetInfo title="Monthly points" value={result.monthly_ap} image={`${base}/assets/rewards/AP.png`} />
		<WidgetInfo title="Points from achieves" value={sum(result.categories, 'points_done')} image={`${base}/assets/rewards/AP.png`} />
		<!-- <WidgetInfo title="Points total" value={result.monthly_ap + result.daily_ap + sum(result.categories, 'points_done')} image={`${base}/assets/rewards/AP.png`} /> -->
	</WidgetsGroup>
	<WidgetsGroup name="Achievements' to do">
		<WidgetInfo title="Achieves to do" value={result.todo} image="{base}/assets/rewards/Daily_Achievement.png" />
		<WidgetInfo title="Points to get" value={sum(result.categories, 'points_to_get')} image="{base}/assets/rewards/AP.png" />
		<WidgetInfo title="Titles to get" value={result.rewards_to_get.get('title')} image="{base}/assets/rewards/Talk_collection_option.png" />
		<WidgetInfo title="Items to get" value={result.rewards_to_get.get('item')} image="{base}/assets/rewards/Achievement_Chest_interface_icon.png" />
		<WidgetInfo title="Gold to get" value={result.rewards_to_get.get('coins')} image="{base}/assets/rewards/Merchant_crop.png" let:value>
			<Price {value} />
		</WidgetInfo>
	</WidgetsGroup>

	<section class="tabs-container">
		<Tabs>
			<div class="tab-list">
				<Tab>List</Tab>
				<Tab>To dos</Tab>
			</div>

			<TabPanel>
				<fieldset class="settings">
					<legend>Settings</legend>

					<label><input type="checkbox" bind:checked={notCompleted} /> Not completed</label>
					<label><input type="checkbox" bind:checked={withPoints} /> Points to get</label>
					<label><input type="checkbox" bind:checked={withMasteryCentral} /> Central Tyria mastery</label>
					<label><input type="checkbox" bind:checked={withMasteryHoT} /> HoT mastery</label>
					<label><input type="checkbox" bind:checked={withMasteryPoF} /> PoF mastery</label>
					<label><input type="checkbox" bind:checked={withMasteryIce} /> Icebrood Saga mastery</label>
					<label><input type="checkbox" bind:checked={withMasteryEoD} /> EoD mastery</label>
					<label><input type="checkbox" bind:checked={withMasterySofO} /> SofO mastery</label>
					<label><input type="checkbox" bind:checked={withTitles} /> Titles to get</label>
					<label><input type="checkbox" bind:checked={withItems} /> Items to get</label>
					<label><input type="checkbox" bind:checked={withCoins} /> Coins to get</label>

					<label><input type="radio" name="sort" value="ap" bind:group={sortBy} /> sort by points</label>
					<label><input type="radio" name="sort" value="name" bind:group={sortBy} /> sort by name</label>

					<button on:click={saveSettings}>Save settings</button>
				</fieldset>

				<section>
					<label for="filter">Filter:</label>
					<SearchInput bind:value={filter} name="filter" id="filter" placeholder="too much data?" />
				</section>

				<span>showing {_result.categories.length} categories out of {result.categories.length}</span>
				<div class="achiev-container">
					{#each sort(_result.categories, sortBy) as category (category.id)}
						<details class="achiev-group">
							<summary>
								<img src={category.icon} alt={category.name} />
								<div class="descr">
									<span
										>{category.name}
										<small
											><a href="https://api.guildwars2.com/v2/achievements/categories/{category.id}" target="_blank">id: {category.id}</a
											></small
										></span
									>
									<div class="rewards large">
										{#if category.rewards_to_get.has('title')}
											<div class="reward-item">
												<span>{category.rewards_to_get.get('title')}</span>
												<img src="{base}/assets/rewards/Title_icon.png" alt="title" title="This category rewards a title" />
											</div>
										{/if}
										{#if category.rewards_to_get.has('coins')}
											<div class="reward-item">
												<Price value={category.rewards_to_get.get('coins')} />
											</div>
										{/if}
										{#if category.rewards_to_get.has('item')}
											<div class="reward-item">
												<span>{category.rewards_to_get.get('item')}</span>
												<img
													src="{base}/assets/rewards/Achievement_Chest_interface_icon.png"
													alt="item"
													title="This category rewards items"
												/>
											</div>
										{/if}
										{#if category.rewards_to_get.has('mastery_tyria')}
											<div class="reward-item">
												<span>{category.rewards_to_get.get('mastery_tyria')}</span>
												<img
													src="{base}/assets/rewards/Mastery_point_Central_Tyria.png"
													alt="mastery points Central Tyria"
													title="This category rewards Central Tyria mastery points"
												/>
											</div>
										{/if}
										{#if category.rewards_to_get.has('mastery_maguuma')}
											<div class="reward-item">
												<span>{category.rewards_to_get.get('mastery_maguuma')}</span>
												<img
													src="{base}/assets/rewards/Mastery_point_Heart_of_Thorns.png"
													alt="mastery points Heart of Thorns"
													title="This category rewards Heart of Thorns mastery points"
												/>
											</div>
										{/if}
										{#if category.rewards_to_get.has('mastery_desert')}
											<div class="reward-item">
												<span>{category.rewards_to_get.get('mastery_desert')}</span>
												<img
													src="{base}/assets/rewards/Mastery_point_Path_of_Fire.png"
													alt="mastery points Path of Fire"
													title="This category rewards Path of Fire mastery points"
												/>
											</div>
										{/if}
										{#if category.rewards_to_get.has('mastery_tundra')}
											<div class="reward-item">
												<span>{category.rewards_to_get.get('mastery_tundra')}</span>
												<img
													src="{base}/assets/rewards/Mastery_point_Icebrood_Saga.png"
													alt="mastery points Icebrood Saga"
													title="This category rewards Icebrood Saga mastery points"
												/>
											</div>
										{/if}
										{#if category.rewards_to_get.has('mastery_jade')}
											<div class="reward-item">
												<span>{category.rewards_to_get.get('mastery_jade')}</span>
												<img
													src="{base}/assets/rewards/Mastery_point_End_of_Dragons.png"
													alt="mastery points End of Dragons"
													title="This category rewards End of Dragons mastery points"
												/>
											</div>
										{/if}
										{#if category.rewards_to_get.has('mastery_sky')}
											<div class="reward-item">
												<span>{category.rewards_to_get.get('mastery_sky')}</span>
												<img
													src="{base}/assets/rewards/Mastery_point_Secrets_of_the_Obscure.png"
													alt="mastery points Secrets of the Obscure"
													title="This category rewards Secrets of the Obscure mastery points"
												/>
											</div>
										{/if}
										{#if category.points_to_get}
											<div class="reward-item">
												<span>{category.points_to_get}</span>
												<img
													src="{base}/assets/rewards/AP.png"
													alt="achievement points"
													title="You can get {category.points_to_get} achievement points from this category"
												/>
											</div>
										{/if}
										<div class="reward-item">
											<span>{category.achievements.length}</span>
											<img
												src="{base}/assets/rewards/Achievements_Summary.png"
												alt="achieves"
												title="There are {category.achievements.length} achievements left to do"
											/>
										</div>
									</div>
								</div>
							</summary>
							{#if category.description}<p>{category.description}</p>{/if}
							<AchievList items={sort(category.achievements, sortBy)} {todoList} on:toggle-todo={hndToggleTodo} />
						</details>
					{/each}
				</div>
			</TabPanel>

			<TabPanel>
				<h2>Your list</h2>
				<AchievList items={expandToDoList(result, todoList)} {todoList} on:toggle-todo={hndToggleTodo} />
			</TabPanel>
		</Tabs>
	</section>
</Awaiter>

<style lang="scss">
	.achiev-container {
		display: flex;
		flex-flow: column nowrap;
		gap: 1rem;
		margin: 0 0 1rem 0;
	}
	.achiev-group {
		display: flex;
		flex-flow: column wrap;
		gap: 1rem;
		margin: 0;
		background-color: var(--gw2helper-module);
		summary {
			padding: 0.4rem 0.4rem;
			display: flex;
			flex-flow: row nowrap;
			justify-content: flex-start;
			align-items: center;
			gap: 0.6rem;
			&::before {
				content: '\25b6';
				transition: 0.2s;
			}

			.descr {
				display: flex;
				flex-flow: column nowrap;
				justify-content: flex-start;
				align-items: flex-start;
				gap: 0.6rem;
				width: 100%;
			}
		}
		&[open] summary::before {
			transform: rotate(90deg);
		}
		img {
			width: 48px;
			height: 48px;
		}
	}
	.rewards {
		width: 100%;
		display: flex;
		flex-flow: row wrap;
		align-items: center;
		justify-content: flex-end;
		column-gap: 0.6rem;
		row-gap: 0.2rem;
		// font-family: monospace;
		&.large {
			.reward-item {
				font-size: medium;
				img {
					width: 24px;
					height: 24px;
				}
			}
		}

		.reward-item {
			display: flex;
			flex-flow: row nowrap;
			align-items: center;
			font-size: medium;
			img {
				width: 24px;
				height: 24px;
			}
		}
	}

	@media (min-width: 420px) {
		.achiev-group {
			summary {
				.descr {
					flex-flow: row nowrap;
					justify-content: space-between;
					align-items: center;
					gap: 0.6rem;
					width: 100%;
				}
			}
		}
		.rewards {
			width: auto;
			&.large {
				.reward-item {
					font-size: large;
					img {
						width: 36px;
						height: 36px;
					}
				}
			}
		}
	}

	.tabs-container {
		margin-top: 4rem;
	}
</style>
