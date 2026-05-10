<script lang="ts">
	import { asset } from '$app/paths';
	import Awaiter from '$lib/components/awaiter.svelte';
	import SearchInput from '$lib/components/searchInput.svelte';
	import helperUtils from '$lib/utils/helper-utils';
	import { t as _ } from '$lib/services/i18n.js';
	import { grungeBorder } from '$lib/actions/grungeBorder';

	/** @type {{data: any}} */
	let { data } = $props();
	let filter = $state('');
	const fields = ['name', 'race', 'gender', 'profession', 'level', 'title', 'crafting_discipline']; // nested properties not suported yet

	type CharacterCraft = { discipline: string; rating: number };
	type Character = {
		name: string;
		created: string;
		gender: string;
		race: string;
		profession: string;
		level: number;
		crafting?: CharacterCraft[];
		deaths: number;
		age: number;
	};

	function professionIcon(name: string) {
		return asset(`/assets/professions/${name}_icon.png`);
	}

	function icon(name: string) {
		return asset(`/assets/${name}`);
	}

	function craftIcon(name: string) {
		// return resolve(`/assets/craft/${name}_tango_icon_48px.png`);
		return asset(`/assets/craft/map_crafting_${name.toLowerCase()}.png`);
	}

	function iconScale(createdAt: string) {
		return Math.round(28 + ((365 - helperUtils.tillBirthday(createdAt)) / 365) * 100)+"px";
	}

	function deathsPerHour(char: Character) {
		return (char.age > 3600 ? (char.deaths | 0) / helperUtils.hoursPlayed(char.age) : char.deaths | 0).toFixed(2);
	}
</script>

<h1>{$_('characters.characters')}</h1>
<SearchInput bind:value={filter} name="filter" id="filter" placeholder={$_('common.what_are_you_looking_for')} />

<Awaiter promise={data.characters}>
	{#snippet children(result: Character[])}
		{@const filtered = helperUtils.filterCollection(result, fields, filter) as Character[]}
		{#each filtered.sort((a, b) => -1 * (a.age - b.age)) as char}
			{@const days = helperUtils.tillBirthday(char.created)}
			{@const gender = char.gender.toLowerCase()}
			<details use:grungeBorder open>
				<summary>{char.name}</summary>
				<article class="character">
					<section>
						<div class="sect-prof">
							<span>{char.profession}</span>
							<img src={professionIcon(char.profession)} alt={char.profession} />
							<span>lvl. {char.level}</span>
						</div>
						<div class="sect-info">
							<div class="info">{char.gender} {char.race}</div>
							{#if char.crafting}
								<ul class="info icons">
									{#each char.crafting as craft}
										<li><img src={craftIcon(craft.discipline)} alt="craft.discipline" />{craft.discipline}: {craft.rating}</li>
									{:else}
										<li class="no-results">{$_('characters.no_crafting_professions')}</li>
									{/each}
								</ul>
							{/if}
							<div class="info">{$_('characters.hours_played')}</div>
							<div class="counter">{helperUtils.hoursPlayed(char.age)}</div>
						</div>
					</section>
					<section>
						<div class="sect-prof">
							<img src={icon('Present_quaggan_icon.png')} alt="present" style:width={iconScale(char.created)} />
						</div>
						<div class="sect-info">
							<div class="counter">{$_('characters.years', { age: helperUtils.age(char.created) })}</div>
							<div class="info">{$_('characters.next_birthday_in')}</div>
							<div class="counter">{days} <span class="info">{$_('characters.days', { days })}</span></div>
						</div>
					</section>
					<section>
						<div class="sect-prof">
							<img src={icon('Grave_Finisher.png')} alt="gravestone" />
						</div>
						<div class="sect-info">
							<div class="info">{$_('characters.died', { gender })}</div>
							<div class="counter">{char.deaths} <span class="info">{$_('characters.times', { times: char.deaths })}</span></div>
							<div class="info">({deathsPerHour(char)}/h)</div>
						</div>
					</section>
				</article>
			</details>
		{/each}
	{/snippet}
</Awaiter>

<style lang="scss">
	.character {
		display: flex;
		margin: 0;
		padding: 0.625em;
		width: 100%;
		gap: 1em;
		padding-bottom: 1em;

		flex-flow: column nowrap;
		justify-content: space-between;
		align-items: center;
		background-color: var(--gw2helper-module);
		color: var(--gw2helper-module-text);
		height: fit-content;

		.sect-prof {
			display: flex;
			width: 128px;
			flex-flow: column nowrap;
			justify-content: center;
			align-items: center;
			min-height: 128px;
			span {
				font-weight: bold;
				text-align: center;
			}
		}

		.sect-info {
			display: flex;
			flex-flow: column nowrap;
			align-items: flex-start;
			justify-content: center;
			min-width: 10em;
			ul {
				margin: 0.2em 0;
			}
		}

		.counter {
			padding: 0 0 0.5em 0;
			font-size: x-large;
			font-weight: bold;
		}
		.info {
			font-size: 1em;
			font-weight: normal;
		}
	}

	section {
		margin: 0;
		padding: 0;
		display: flex;
		flex-flow: row nowrap;
		column-gap: 0.5em;
		max-height: 13.75em;
		min-width: 20em;
		align-items: flex-start;
		justify-content: flex-start;
		align-content: flex-start;
		row-gap: 0.6em;

		ul {
			margin: 1em 0;
			list-style-type: none;
			list-style-position: inside;
			padding: 0;
			&.icons {
				img {
					width: 2em;
					vertical-align: middle;
					margin: 0.125em 0.3125em 0.125em 0;
				}
			}
		}
	}

	@media (min-width: 700px) {
		.character {
			flex-flow: row wrap;
			align-items: center;
			justify-content: space-evenly;

			section {
				// min-width: 23.125em;
				flex-flow: column wrap;
			}
		}
	}
</style>
