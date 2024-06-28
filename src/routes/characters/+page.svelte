<script>
	import { base } from '$app/paths';
	import Awaiter from '$lib/components/awaiter.svelte';

	export let data;

	function diff(createdAt) {
		const dt = new Date(createdAt);
		return Math.floor((new Date().getTime() - dt.getTime()) / (1000 * 3600 * 24));
	}
	function tillBirthday(createdAt) {
		return 365 - (diff(createdAt) % 365);
	}

	function age(createdAt) {
		return Math.floor(diff(createdAt) / 365);
	}

	function hoursPlayed(time) {
		return Math.trunc(time / 3600);
	}

	function icon(name) {
		return `${base}/assets/${name}`;
	}

	function iconOpacity(createdAt) {
		let perc = 1 - tillBirthday(createdAt) / 365;
		return perc < 0.1 ? 0.1 : perc;
	}

	function iconScale(createdAt) {
		return 28 + ((365 - tillBirthday(createdAt)) / 365) * 100;
	}

	function deathsPerHour(char) {
		return (char.age > 3600 ? (char.deaths | 0) / hoursPlayed(char.age) : char.deaths | 0).toFixed(2);
	}
</script>

<h1>Characters</h1>
<Awaiter promise={data.characters} let:result>
	{#each result.sort((a, b) => -1 * (a.age - b.age)) as char}
		<article class="character">
			<h2>{char.name}</h2>
			<section>
				<div class="sect-img" style="background-image: url({icon(char.profession + '_icon.png')});"></div>
				<div class="sect-info">
					<h4>{char.profession}</h4>
					<div class="info">hours played</div>
					<div class="counter">{hoursPlayed(char.age)}</div>
				</div>
			</section>
			<section>
				<div
					class="sect-img"
					style="background-image: url({icon('Present_quaggan_icon.png')}); background-size: {iconScale(
						char.created
					)}px;"
				></div>
				<div class="sect-info">
					<div class="counter">{age(char.created)} years</div>
					<div class="info">next birthday in</div>
					<div class="counter">{tillBirthday(char.created)} <span class="info">days</span></div>
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
		.sect-img{
			width: 128px;
			height: 128px;
			background-repeat: no-repeat;
			background-position: bottom center;
		}
		.sect-info{
			display: flex;
			flex-flow: column nowrap;
			align-items: center;
			justify-content: center;
			row-gap: 0.5rem;
			h4{
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

	@media (min-width: 400px) {
		.character {
			width: 100%;
			flex-flow: row wrap;
			gap: 1rem;
			padding-bottom: 1rem;
			h2 {
				text-align: left;
			}
			.sect-info{
				align-items: flex-start;
			}
			.sect-img{
				background-position-y: center;
			}
			section {
				width: 260px;
				height: 128px;
				flex-flow: row nowrap;
				align-items: center;
				column-gap: 0.5rem;
				justify-content: flex-start;
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
