<script>
	import helperUtils from '$lib/utils/helper-utils';
	import SearchInput from '$lib/components/searchInput.svelte';
	import Awaiter from '$lib/components/awaiter.svelte';
	import WidgetInfo from '$lib/components/widgetInfo.svelte';
	import WidgetsGroup from '$lib/components/widgetsGroup.svelte';
	import { sum } from '$lib/utils';
	import utils from '$lib/utils';
	import { base } from '$app/paths';
	export let data;

	let filter = '';
	const fields = ['name', 'category', 'description'];

	const settings = utils.readAchievesSettings();

	let notCompleted = settings.notCompleted == undefined ? true : settings.notCompleted;
	let withPoints = settings.withPoints == undefined ? false : settings.withPoints;
	let withMasteryCentral = settings.withMasteryCentral == undefined ? false : settings.withMasteryCentral;
	let withMasteryHoT = settings.withMasteryHoT == undefined ? false : settings.withMasteryHoT;
	let withMasteryPoF = settings.withMasteryPoF == undefined ? false : settings.withMasteryPoF;
	let withMasteryIce = settings.withMasteryIce == undefined ? false : settings.withMasteryIce;
	let withMasteryEoD = settings.withMasteryEoD == undefined ? false : settings.withMasteryEoD;
	let withMasterySofO = settings.withMasterySofO == undefined ? false : settings.withMasterySofO;

	$: filterObj = {
		filter,
		notCompleted,
	};

	function filterCallback(item, filter, filterResult) {
		return (
			item.achievements.findIndex((achiev) => {
				const mastery = achiev.rewardsObj.mastery || [];
				const masteryRequired = withMasteryCentral || withMasteryHoT || withMasteryPoF || withMasteryIce || withMasteryEoD || withMasterySofO;
				return (
					(!notCompleted || !achiev.done) &&
					(!withPoints || achiev.points_to_get > 0) &&
					// (!masteryRequired && mastery.length > 0) &&
					mastery.find(
						(x) =>
							(!withMasteryCentral || x.region == 'Tyria') &&
							(!withMasteryHoT || x.region == 'Maguuma') &&
							(!withMasteryPoF || x.region == 'Desert') &&
							(!withMasteryIce || x.region == 'Tundra') &&
							(!withMasteryEoD || x.region == 'Jade') &&
							(!withMasterySofO || x.region == 'Sky')
					) &&
					helperUtils.fullTextSearch(filter, achiev, ['name', 'desription', 'requirements'])
				);
			}) >= 0
		);
	}

	function saveSettings() {
		utils.saveEventTimerSettings({
			notCompleted,
			withPoints,
			withMasteryCentral,
			withMasteryHoT,
			withMasteryPoF,
			withMasteryIce,
			withMasteryEoD,
			withMasterySofO,
		});
	}

	function filteredAchieves(data, params) {
		let obj = {
			completed: data.completed,
			todo: data.todo,
			daily_ap: data.daily_ap,
			monthly_ap: data.monthly_ap,
		};

		obj.categories = helperUtils.filterCollection(data.categories, ['name', 'description'], filter, {
			nonZero: false,
			filterCallback,
			callbackOnly: false,
		});

		return obj;
	}
</script>

<img src="/gw2helper/assets/150px-construction.png" title="Under constrution" width="150px" alt="under construction" />

<h1>Achievements</h1>

<fieldset class="settings">
	<legend>Settings</legend>

	<label><input type="checkbox" bind:checked={notCompleted} /> Hide completed</label>
	<label><input type="checkbox" bind:checked={withPoints} /> with points to get</label>
	<label><input type="checkbox" bind:checked={withMasteryCentral} /> with Central Tyria mastery</label>
	<label><input type="checkbox" bind:checked={withMasteryHoT} /> with HoT mastery</label>
	<label><input type="checkbox" bind:checked={withMasteryPoF} /> with PoF mastery</label>
	<label><input type="checkbox" bind:checked={withMasteryIce} /> with Ice mastery</label>
	<label><input type="checkbox" bind:checked={withMasteryEoD} /> with EoD mastery</label>
	<label><input type="checkbox" bind:checked={withMasterySofO} /> with SofO mastery</label>
	<button on:click={saveSettings}>Save settings</button>
</fieldset>

<section>
	<label for="filter">Filter:</label>
	<SearchInput bind:value={filter} name="filter" id="filter" placeholder="too much data?" />
</section>

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
	])}
	<WidgetsGroup name="Achievements' completed">
		<WidgetInfo title="Achieves completed" value={result.completed} image={`${base}/assets/rewards/Monthly_Achievement.png`} />
		<WidgetInfo title="Daily points" value={result.daily_ap} image={`${base}/assets/rewards/AP.png`} />
		<WidgetInfo title="Monthly points" value={result.monthly_ap} image={`${base}/assets/rewards/AP.png`} />
		<WidgetInfo title="Points from achieves" value={sum(result.categories, 'points_done')} image={`${base}/assets/rewards/AP.png`} />
		<!-- <WidgetInfo title="Points total" value={result.monthly_ap + result.daily_ap + sum(result.categories, 'points_done')} image={`${base}/assets/rewards/AP.png`} /> -->
	</WidgetsGroup>
	<WidgetsGroup name="Achievements' to do">
		<WidgetInfo title="Achieves to do" value={result.todo} image={`${base}/assets/rewards/Daily_Achievement.png`} />
		<WidgetInfo title="Points to get" value={sum(result.categories, 'points_to_get')} image={`${base}/assets/rewards/AP.png`} />
	</WidgetsGroup>
	<span>showing {_result.categories.length} categories out of {result.categories.length}</span>
	<div class="achiev-container">
		{#each _result.categories as category (category.id)}
			{@const cat_mastery = category.rewards.mastery || []}
			<details class="achiev-group">
				<summary>
					<img src={category.icon} alt={category.name} />
					<div class="descr">
						<span
							>{category.name}
							<small><a href="https://api.guildwars2.com/v2/achievements/{category.id}" target="_blank">id: {category.id}</a></small></span
						>
						<div class="rewards">
							{#if category.rewards.title}
								<div class="reward-item">
									<img src="{base}/assets/rewards/Title_icon.png" alt="title" title="This category rewards a title" />
								</div>
							{/if}
							{#if category.rewards.coins}
								<div class="reward-item">
									<img src="{base}/assets/rewards/Gold_coin_(highres).png" alt="gold" title="This category rewards gold" />
								</div>
							{/if}
							{#if category.rewards.item}
								<div class="reward-item">
									<img src="{base}/assets/rewards/Achievement_Chest_(interface_icon).png" alt="item" title="This category rewards items" />
								</div>
							{/if}
							{#if cat_mastery}
								{#if cat_mastery.find((x) => x.region == 'Tyria')}
									<div class="reward-item">
										<img
											src="{base}/assets/rewards/Mastery_point_(Central_Tyria).png"
											alt="mastery points Central Tyria"
											title="This category rewards Central Tyria mastery points"
										/>
									</div>
								{/if}
								{#if cat_mastery.find((x) => x.region == 'Maguuma')}
									<div class="reward-item">
										<img
											src="{base}/assets/rewards/Mastery_point_(Heart_of_Thorns).png"
											alt="mastery points Heart of Thorns"
											title="This category rewards Heart of Thorns mastery points"
										/>
									</div>
								{/if}
								{#if cat_mastery.find((x) => x.region == 'Desert')}
									<div class="reward-item">
										<img
											src="{base}/assets/rewards/Mastery_point_(Path_of_Fire).png"
											alt="mastery points Path of Fire"
											title="This category rewards Path of Fire mastery points"
										/>
									</div>
								{/if}
								{#if cat_mastery.find((x) => x.region == 'Tundra')}
									<div class="reward-item">
										<img
											src="{base}/assets/rewards/Mastery_point_(Icebrood_Saga).png"
											alt="mastery points Icebrood Saga"
											title="This category rewards Icebrood Saga mastery points"
										/>
									</div>
								{/if}
								{#if cat_mastery.find((x) => x.region == 'Jade')}
									<div class="reward-item">
										<img
											src="{base}/assets/rewards/Mastery_point_(End_of_Dragons).png"
											alt="mastery points End of Dragons"
											title="This category rewards End of Dragons mastery points"
										/>
									</div>
								{/if}
								{#if cat_mastery.find((x) => x.region == 'Sky')}
									<div class="reward-item">
										<img
											src="{base}/assets/rewards/Mastery_point_(Secrets_of_the_Obscure).png"
											alt="mastery points Secrets of the Obscure"
											title="This category rewards Secrets of the Obscure mastery points"
										/>
									</div>
								{/if}
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
				<div class="achiev-list">
					{#each helperUtils.filterCollection(category.achievements, fields, filter) as achiev (achiev.id)}
						{@const mastery = achiev.rewardsObj.mastery}
						<div class="achiev">
							<div class="head">
								{#if achiev.icon}
									<img src={achiev.icon} alt={achiev.name} />
								{:else}
									<img src={category.icon} alt={achiev.name} />
								{/if}

								{#if achiev.current}
									<progress value={achiev.current} max={achiev.max} />
									<span>{achiev.current} / {achiev.max}</span>
								{/if}
								{#if achiev.flags && achiev.flags.includes('Hidden')}
									<img
										class="icon"
										src="{base}/assets/rewards/Achievements_Watch_List.png"
										alt="hidden achievement"
										title="This is a hidden achievement"
									/>
								{/if}
								<small><a href="https://api.guildwars2.com/v2/achievements/{achiev.id}" target="_blank">id: {achiev.id}</a></small>
							</div>
							<div class="body">
								<h3>{achiev.name}</h3>
								{#if achiev.description}<span>{achiev.description}</span>{/if}
								{#if achiev.requirement}<span>{achiev.requirement}</span>{/if}

								<div class="rewards small">
									{#if achiev.type == 'ItemSet'}
										<div class="reward-item">
											<img
												src="{base}/assets/rewards/Talk_collection_option.png"
												alt="title"
												title="This achievement is linked to a collection"
											/>
										</div>
									{/if}

									{#if achiev.rewardsObj.title}
										<div class="reward-item">
											<img src="{base}/assets/rewards/Title_icon.png" alt="title" title="This achievement rewards a title" />
										</div>
									{/if}
									{#if achiev.rewardsObj.coins}
										<div class="reward-item">
											<img src="{base}/assets/rewards/Gold_coin_(highres).png" alt="gold" title="This achievement rewards gold" />
										</div>
									{/if}
									{#if achiev.rewardsObj.item}
										<div class="reward-item">
											<img
												src="{base}/assets/rewards/Achievement_Chest_(interface_icon).png"
												alt="item"
												title="This achievement rewards items"
											/>
										</div>
									{/if}
									{#if mastery}
										{#if mastery.find((x) => x.region == 'Tyria')}
											<div class="reward-item">
												<img
													src="{base}/assets/rewards/Mastery_point_(Central_Tyria).png"
													alt="mastery points Central Tyria"
													title="This achievement rewards Central Tyria mastery points"
												/>
											</div>
										{/if}
										{#if mastery.find((x) => x.region == 'Maguuma')}
											<div class="reward-item">
												<img
													src="{base}/assets/rewards/Mastery_point_(Heart_of_Thorns).png"
													alt="mastery points Heart of Thorns"
													title="This achievement rewards Heart of Thorns mastery points"
												/>
											</div>
										{/if}
										{#if mastery.find((x) => x.region == 'Desert')}
											<div class="reward-item">
												<img
													src="{base}/assets/rewards/Mastery_point_(Path_of_Fire).png"
													alt="mastery points Path of Fire"
													title="This achievement rewards Path of Fire mastery points"
												/>
											</div>
										{/if}
										{#if mastery.find((x) => x.region == 'Tundra')}
											<div class="reward-item">
												<img
													src="{base}/assets/rewards/Mastery_point_(Icebrood_Saga).png"
													alt="mastery points Icebrood Saga"
													title="This achievement rewards Icebrood Saga mastery points"
												/>
											</div>
										{/if}
										{#if mastery.find((x) => x.region == 'Jade')}
											<div class="reward-item">
												<img
													src="{base}/assets/rewards/Mastery_point_(End_of_Dragons).png"
													alt="mastery points End of Dragons"
													title="This achievement rewards End of Dragons mastery points"
												/>
											</div>
										{/if}
										{#if mastery.find((x) => x.region == 'Sky')}
											<div class="reward-item">
												<img
													src="{base}/assets/rewards/Mastery_point_(Secrets_of_the_Obscure).png"
													alt="mastery points Secrets of the Obscure"
													title="This achievement rewards Secrets of the Obscure mastery points"
												/>
											</div>
										{/if}
									{/if}
									{#if achiev.points_to_get}
										<div class="reward-item">
											<span>{achiev.points_to_get}</span>
											<img
												src="{base}/assets/rewards/AP.png"
												alt="achievement points"
												title="You can get {achiev.points_to_get} achievement points from this achievement"
											/>
										</div>
									{/if}
									{#if achiev.bits}
										<div class="reward-item">
											<span>{achiev.bits_done.length} / {achiev.bits.length}</span>
											<img
												src="{base}/assets/rewards/Achievements_Summary.png"
												alt="achieves"
												title="There are {achiev.bits.length - achiev.bits_done.length} tasks left to do"
											/>
										</div>
									{/if}
								</div>
							</div>
						</div>
					{/each}
				</div>
			</details>
		{/each}
	</div>
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
	.achiev-list {
		display: flex;
		flex-flow: row wrap;
		gap: 1rem;
		margin: 0 10px;
	}
	.achiev {
		width: 335px;
		display: flex;
		flex-flow: row nowrap;
		padding: 0.5rem;
		row-gap: 0.2rem;
		column-gap: 0.6rem;

		border-radius: 5px;
		background-color: var(--gw2helper-module-white);
		box-shadow: var(--gw2helper-module-shadow);
		color: #000;
		flex: 0 1 auto;
		&:hover {
			box-shadow: var(--gw2helper-module-shadow-hover);
		}
		.head {
			display: flex;
			flex-flow: column nowrap;
			row-gap: 0.6rem;
			width: 25%;
			min-width: 80px;
			justify-content: center;
			align-items: center;
			progress {
				width: 100%;
			}
			span {
				font-size: x-small;
				overflow-wrap: break-word;
			}
			small {
				font-size: xx-small;
			}
			img {
				width: 48px;
				height: 48px;
				&.icon {
					cursor: help;
					width: 24px;
					height: 24px;
				}
			}
		}
		.body {
			display: flex;
			flex-flow: column nowrap;
			row-gap: 0.6rem;
			width: 100%;
			min-height: 120px;
			justify-content: space-between;
			font-size: small;
			h3 {
				margin: 0;
				font-size: medium;
			}
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
		&.small {
			font-size: smaller;
			span {
				font-size: small;
			}
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
		span {
			font-size: large;
		}
		img {
			width: 24px;
			height: 24px;
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
		}
		.reward-item {
			span {
				font-size: x-large;
			}
			img {
				width: 36px;
				height: 36px;
			}
		}
	}
</style>
