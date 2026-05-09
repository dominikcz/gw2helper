<script>
	import { onMount } from 'svelte';
	import ArrowBack from './arrowBack.svelte';
	import ArrowForward from './arrowForward.svelte';
	/** @type {{items?: any, active: any, showScrollButtons?: boolean}} */
	let { items = [], active, showScrollButtons = true } = $props();

	let navLeftVisible = $state(false);
	let navRightVisible = $state(false);

	let navRef = $state();
	onMount(() => {
		hndScroll();
	});

	function hndScroll() {
		const rect = navRef.getBoundingClientRect();
		navLeftVisible = navRef.scrollLeft > 32;
		navRightVisible = navRef.scrollWidth > Math.round(navRef.scrollLeft + navRef.offsetWidth);
	}

	function scrollLeft() {
		// scroll to last elem with left < 0
		let pos = 0;
		let i = 0;
		for (const child of navRef.children) {
			const rect = child.getBoundingClientRect();
			if (i > 0 && rect.left > 0) {
				break;
			} else {
				pos = Math.abs(rect.left);
			}
			i++;
		}
		if (i >= 1) {
			pos += 48;
		}
		navRef.scrollLeft -= pos;
	}

	function scrollRight() {
		// scroll to 2nd elem with left > 0
		let pos = 50;
		let i = 0;
		for (const child of navRef.children) {
			const rect = child.getBoundingClientRect();
			if (rect.left > pos) {
				pos = rect.left;
				break;
			}
			i++;
		}
		if (i >= 1) {
			pos -= 48;
		}
		navRef.scrollLeft += pos;
	}

	function navLeft() {
		if (navRef) {
			scrollLeft();
		}
	}

	function navRight() {
		if (navRef) {
			scrollRight();
		}
	}
</script>

<svelte:window onresize={hndScroll} />

<nav id="main-nav" bind:this={navRef} onscroll={hndScroll}>
	{#if showScrollButtons && navLeftVisible}
		<a class="nav-btn left" href={'#'} onclick={navLeft} onkeydown={navLeft} role="button" tabindex="0"><ArrowBack /></a>
	{/if}
	{#each items as item, i}
		<a href={item.slug} data-sveltekit-preload-data="tap" class:active={active == item.slug}>{item.label}</a>
	{/each}
	{#if showScrollButtons && navRightVisible}
		<a class="nav-btn right" href={'#'} onclick={navRight} onkeydown={navRight} role="button" tabindex="0"><ArrowForward /></a>
	{/if}
</nav>

<style lang="scss" global>
	nav {
		background-color: var(--nav-bg, #222);
		padding: 0 0.6em 0.9em 0.6em;
		display: flex;
		flex-flow: row nowrap;
		overflow-x: auto;
		overflow-y: hidden;
		-webkit-overflow-scrolling: touch;
		gap: 2em;
		height: 3em;
		scrollbar-width: thin;
		user-select: none;

		a {
			padding: 0.3em 1em;
			color: var(--nav-fg, #aaa);
			text-decoration: none;
			transition: border 0.4s ease-in-out;
			white-space: nowrap;
			height: 2rem;
			// border-radius: 5px;
			&:hover {
				border-bottom: 0.25em dotted var(--nav-active, #fff);
				color: var(--nav-active, #fff);
			}
			&.active {
				border-bottom: 0.25em solid var(--nav-active, #fff);
				color: var(--nav-active, #fff);
				cursor: auto;
			}
		}
	}

	.nav-btn {
		position: absolute;
		background: var(--nav-bg, #222);
		display: flex;
		flex-flow: column nowrap;
		align-items: center;
		justify-content: center;
		width: 3em;
		height: auto;
		padding: 0.3em 1em;
		color: var(--nav-fg);
		&:hover {
			color: var(--nav-active);
			border: none;
		}
		// background-position: center;
		// background-repeat: no-repeat;
		// background-size: 24px 24px;
		&.left {
			left: 0;
			// background-image: url(/gw2helper/icons/arrow_back.svg);
		}
		&.right {
			left: calc(100% - 3em);
			// background-image: url(/gw2helper/icons/arrow_forward.svg);
		}
	}

</style>
