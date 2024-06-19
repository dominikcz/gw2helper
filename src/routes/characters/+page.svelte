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

	function iconPosition(createdAt) {
		return (128 - iconScale(createdAt)) / 2;
	}
</script>

<h1>Characters</h1>
<Awaiter promise={data.characters} let:result >
	{#each result.sort((a, b) => -1 * (a.age - b.age)) as char}
		<article class="character">
			<h2>{char.name}</h2>
			<section style="background-image: url({icon(char.profession + '_icon.png')});">
				<h4>{char.profession}</h4>
				<div class="info">hours played</div>
				<div class="counter">{hoursPlayed(char.age)}</div>
			</section>
			<section
				style="background-image: url({icon('Present_quaggan_icon.png')}); background-size: {iconScale(
					char.created
				)}px; background-position: {iconPosition(char.created)}px top;"
			>
				<div class="counter">{age(char.created)} years</div>
				<div class="info">next birthday in</div>
				<div class="counter">{tillBirthday(char.created)}<span class="info">&nbsp;days</span></div>
			</section>
			<section style="background-image: url({icon('Grave_Finisher.png')});">
				<div class="info">died</div>
				<div class="counter">{char.deaths}</div>
				<div class="info">times</div>
			</section>
		</article>
	{/each}
</Awaiter>

<style lang="scss" >
	.character {
		margin: 0;
		padding: 10px;
		display: flex;
		flex-flow: row wrap;
		justify-content: space-around;
		column-gap: 20px;
		background-color: #dcdcdc;
		h2 {
			width: 100%;
			margin: 0.2rem 0 1rem 0;
			padding: 0;
			text-align: center;
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
			padding: 120px 0 0 0;
			background-position: top center;
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

	@media (min-width: 900px) {
		.character {
			width: 900px;
			h2 {
				text-align: left;
			}
			section {
				width: 280px;
				height: 150px;
				padding: 0 0 0 140px;
				background-position: left center;
				flex-flow: column nowrap;
				align-items: flex-start;
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
