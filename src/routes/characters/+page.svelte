<script>
	import { base } from '$app/paths';
	import Awaiter from '$lib/components/awaiter.svelte';
	import SearchInput from '$lib/components/searchInput.svelte';
	import helperUtils from '$lib/utils/helper-utils';
	import { t as _ } from '$lib/services/i18n.js';
	import { grungeBorder } from '$lib/actions/grungeBorder';

	/** @type {{data: any}} */
	let { data } = $props();
	let filter = $state('');
	const fields = ['name', 'race', 'gender', 'profession', 'level', 'title', 'crafting_discipline']; // nested properties not suported yet

	function professionIcon(name) {
		return `${base}/assets/professions/${name}_icon.png`;
	}

	function icon(name) {
		return `${base}/assets/${name}`;
	}

	function craftIcon(name) {
		// return `${base}/assets/craft/${name}_tango_icon_48px.png`;
		return `${base}/assets/craft/map_crafting_${name.toLowerCase()}.png`;
	}

	function iconScale(createdAt) {
		return 28 + ((365 - helperUtils.tillBirthday(createdAt)) / 365) * 100;
	}

	function deathsPerHour(char) {
		return (char.age > 3600 ? (char.deaths | 0) / helperUtils.hoursPlayed(char.age) : char.deaths | 0).toFixed(2);
	}
</script>

<h1>{$_('characters.characters')}</h1>
<SearchInput bind:value={filter} name="filter" id="filter" placeholder={$_('common.what_are_you_looking_for')} />

<Awaiter promise={data.characters}>
	{#snippet children(result)}
		{#each helperUtils.filterCollection(result, fields, filter).sort((a, b) => -1 * (a.age - b.age)) as char}
			{@const days = helperUtils.tillBirthday(char.created)}
			{@const gender = char.gender.toLowerCase()}
			<article class="character" use:grungeBorder>
				<h2>{char.name}</h2>
				<section>
					<h4>{char.profession} lvl. {char.level}</h4>
					<div class="sect-img" style="background-image: url({professionIcon(char.profession)});"></div>
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
					<div
						class="sect-img"
						style="background-image: url({icon('Present_quaggan_icon.png')}); background-size: {iconScale(char.created)}px;"
					></div>
					<div class="sect-info">
						<div class="counter">{$_('characters.years', { age: helperUtils.age(char.created) })}</div>
						<div class="info">{$_('characters.next_birthday_in')}</div>
						<div class="counter">{days} <span class="info">{$_('characters.days', { days })}</span></div>
					</div>
				</section>
				<section>
					<div class="sect-img" style="background-image: url({icon('Grave_Finisher.png')});"></div>
					<div class="sect-info">
						<div class="info">{$_('characters.died', { gender })}</div>
						<div class="counter">{char.deaths} <span class="info">{$_('characters.times', { times: char.deaths })}</span></div>
						<div class="info">({deathsPerHour(char)}/h)</div>
					</div>
				</section>
			</article>
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
		justify-content: space-around;
		align-items: center;
		background-color: var(--gw2helper-module);
		color: var(--gw2helper-module-text);
		height: fit-content;

		h2 {
			width: 100%;
			margin: 0;
			padding: 0;
			text-align: left;
		}
		h4 {
			margin: 0;
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

		.sect-img {
			width: 8em;
			height: 8em;
			background-repeat: no-repeat;
			background-position: bottom center;
		}
		section {
			margin: 0;
			padding: 0;
			display: flex;
			flex-flow: column wrap;
			column-gap: 0.5em;
			max-height: 13.75em;
			min-width: 23.125em;
			align-items: flex-start;
			justify-content: center;
			align-content: flex-start;
			overflow: hidden;
			row-gap: 0.6em;
			column-gap: 2em;

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
		.counter {
			padding: 0.5em 0;
			font-size: x-large;
			font-weight: bold;
		}
		.info {
			font-size: 1em;
			font-weight: normal;
		}
	}

	@media (min-width: 800px) {
		.character {
			flex-flow: row wrap;
			align-items: flex-start;

			section {
				min-width: 23.125em;
				flex-flow: column wrap;
			}
		}
	}
</style>
