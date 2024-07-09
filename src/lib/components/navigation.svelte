<script>
	import { onMount } from "svelte";
	export let items = [];
	export let active;
	export let showScrollButtons = true;

	let navLeftVisible = false;
	let navRightVisible = showScrollButtons;

	let navRef;
	onMount(() =>{
		hndScroll();
	})

	function hndScroll() {
		const rect = navRef.getBoundingClientRect();
		navLeftVisible = navRef.scrollLeft > 50;
		navRightVisible = navRef.scrollLeft < rect.width - 50;
	}

	function navLeft() {
		if (navRef) {
			navRef.scrollLeft -= 100;
		}
	}

	function navRight() {
		if (navRef) {
			navRef.scrollLeft += 100;
		}
	}

</script>

<div class="nav-container">
	<nav id="main-nav" bind:this={navRef} on:scroll={hndScroll}>
		{#if showScrollButtons && navLeftVisible}
			<button class="left" on:click={navLeft}>&lt;</button>
		{/if}
		{#each items as item, i}
			{#if !!item.visible}
				<a href={item.slug} data-sveltekit-preload-data="tap" class:active={active == item.slug}>{item.label}</a>
			{/if}
		{/each}
		{#if showScrollButtons && navRightVisible}
			<button class="right" on:click={navRight}>&gt;</button>
		{/if}
	</nav>
</div>

<style lang="scss" global>
	.nav-container {
		display: block;
		max-width: 800px;
		background-color: var(--nav-bg, #222);
	}
	nav {
		margin: 0 1rem;
		display: flex;
		flex-flow: row nowrap;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		gap: 2rem;
		height: 100%;
		padding-bottom: 0.5rem;

		&.css-scroll-indicators {
			background:
			/* Shadow Cover LEFT */
				linear-gradient(90deg, var(--nav-bg) 60%, rgba(255, 255, 255, 0)) left calc(50% - 5px),
				/* Shadow Cover RIGHT */ linear-gradient(270deg, var(--nav-bg) 60%, rgba(255, 255, 255, 0)) right calc(50% - 5px),
				url(/gw2helper/icons/arrow_back.png) left calc(50% - 5px),
				url(/gw2helper/icons/arrow_forward.png) right calc(50% - 5px);
			background-repeat: no-repeat;
			background-size:
				40px 24px,
				40px 24px,
				24px 24px,
				24px 24px;
			background-attachment: local, local, scroll, scroll;
		}

		button {
			position: fixed;
			width: 30px;
			padding: 0;
			&.left {
				left: 5px;
			}
			&.right {
				left: calc(100% - 30px);
			}
		}

		a {
			padding: 0.3rem 1rem;
			color: var(--nav-fg, #aaa);
			text-decoration: none;
			transition: border 0.4s ease-in-out;
			// border-radius: 5px;
			&:hover {
				border-bottom: 4px dotted var(--nav-active, #fff);
				color: var(--nav-active, #fff);
			}
			&.active {
				border-bottom: 4px solid var(--nav-active, #fff);
				color: var(--nav-active, #fff);
				cursor: auto;
			}
		}
	}

	@media (min-width: 900px) {
		.nav-container {
			max-width: none;
		}
	}
</style>
