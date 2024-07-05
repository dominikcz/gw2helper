<script>
	import { base } from '$app/paths';
	import Awaiter from '$lib/components/awaiter.svelte';
	import SearchInput from '$lib/components/searchInput.svelte';
	import helperUtils from '$lib/utils/helper-utils';

	export let data;
	let filter = '';
	const fields = ['name', 'race', 'gender', 'profession', 'level', 'title', 'crafting_discipline']; // nested properties not suported yet

	function icon(name) {
		return `${base}/assets/${name}`;
	}

	function iconScale(createdAt) {
		return 28 + ((365 - helperUtils.tillBirthday(createdAt)) / 365) * 100;
	}

	function deathsPerHour(char) {
		return (char.age > 3600 ? (char.deaths | 0) / helperUtils.hoursPlayed(char.age) : char.deaths | 0).toFixed(2);
	}
</script>

<h1>Characters</h1>
<SearchInput bind:value={filter} name="filter" id="filter" placeholder="what you are looking for?" />

<Awaiter promise={data.characters} let:result>
	{#each helperUtils.filterCollection(result, fields, filter).sort((a, b) => -1 * (a.age - b.age)) as char}
		<article class="character">
			<h2>{char.name}</h2>
			<section>
				<h4>{char.profession} lvl. {char.level}</h4>
				<div class="sect-img" style="background-image: url({icon(char.profession + '_icon.png')});"></div>
				<div class="sect-info">
					<div class="info">{char.gender} {char.race}</div>
					{#if char.crafting}
						<ul class="info icons">
							{#each char.crafting as craft}
								<li><img src="{base}/assets/icons/{craft.discipline}_tango_icon_48px.png" />{craft.discipline}: {craft.rating}</li>
							{/each}
						</ul>
					{/if}
					<div class="info">hours played</div>
					<div class="counter">{helperUtils.hoursPlayed(char.age)}</div>
				</div>
			</section>
			<section>
				<div class="sect-img" style="background-image: url({icon('Present_quaggan_icon.png')}); background-size: {iconScale(char.created)}px;"></div>
				<div class="sect-info">
					<div class="counter">{helperUtils.age(char.created)} years</div>
					<div class="info">next birthday in</div>
					<div class="counter">{helperUtils.tillBirthday(char.created)} <span class="info">days</span></div>
				</div>
			</section>
			<section>
				<div class="sect-img" style="background-image: url({icon('Grave_Finisher.png')});"></div>
				<div class="sect-info">
					<div class="info">died</div>
					<div class="counter">{char.deaths} <span class="info">times</span></div>
					<div class="info">({deathsPerHour(char)}/h)</div>
				</div>
			</section>
		</article>
	{/each}
</Awaiter>

<style lang="scss">
	.character {
		margin: 0;
		padding: 10px;
		display: flex;
		flex-flow: column nowrap;
		justify-content: space-around;
		gap: 1rem;
		background-color: #dcdcdc;
		h2 {
			width: 100%;
			margin: 0;
			padding: 0;
			text-align: center;
		}
		.sect-img {
			width: 128px;
			height: 128px;
			background-repeat: no-repeat;
			background-position: bottom center;
		}
		.sect-info {
			display: flex;
			flex-flow: column nowrap;
			align-items: center;
			justify-content: center;
			row-gap: 0.2rem;
			ul{
				margin: 0.2rem 0;
			}
			h4 {
				margin: 0;
			}
		}
		section {
			min-width: 150px;
			overflow: hidden;
			margin: 0;
			padding: 0;
			display: flex;
			flex-flow: column nowrap;
			background-repeat: no-repeat;
			justify-content: center;
			align-items: center;
			padding: 0;

			h4 {
				width: 128px;
			}
			ul {
				margin: 1rem 0;
				list-style-type: none;
				list-style-position: inside;
				padding: 0;
				&.icons {
					img {
						height: 1.6rem;
						vertical-align: middle;
						margin: 2px 5px 2px 0;
					}
				}
			}
		}
		.counter {
			padding: 0.5rem 0;
			font-size: x-large;
			font-weight: bold;
		}
		.info {
			font-size: 1rem;
			font-weight: normal;
		}
	}

	@media (min-width: 420px) {
		.character {
			width: 100%;
			gap: 1rem;
			padding-bottom: 1rem;
			flex-flow: row wrap;
			h2 {
				text-align: left;
			}
			.sect-info {
				align-items: flex-start;
				min-width: 160px;
			}

			.sect-img {
				background-position-y: center;
				width: 100px;
			}
			section {
				min-width: 400px;
				flex-flow: column wrap;
				column-gap: 0.5rem;
				max-height: 180px;
				align-items: flex-start;
				justify-content: center;
			}
			.counter {
				padding: 0.5rem 0;
				font-size: x-large;
				font-weight: bold;
			}
			.info {
				font-size: 1rem;
				font-weight: normal;
			}
		}
	}
</style>
