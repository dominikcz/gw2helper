<!-- Originally posted on https://webjeda.com/blog/back-to-top-svelte-component/ -->
<script>
	export let showAtPixel = 1000;

	let scrollHeight = 0;

	const gotoTop = () => {
		window.scrollTo({ top: 0, behavior: 'smooth' });
	};

	$: showGotoTop = scrollHeight > showAtPixel;
</script>

{#if showGotoTop}
	<button class="back-to-top" on:click={gotoTop}>
		<slot><h1>🔝</h1></slot>
	</button>
{/if}

<svelte:window bind:scrollY={scrollHeight} />

<style lang="scss" global>
	.back-to-top {
		position: fixed;
		right: 1em;
		bottom: 2em;
		cursor: pointer;
		transition-duration: 300ms;
		z-index: 9999;
		background-color: transparent;
		border: none;
		padding: 0;
		height: fit-content;
		font-size: 1em;

        &:focus, &:active{
            border:none !important;
            box-shadow: none !important;
            outline: none !important;
        }
		&:hover {
			transform: translateY(-0.625em);
			background-color: transparent;
            * {
                background-color: transparent;
            }
		}

	}
</style>
