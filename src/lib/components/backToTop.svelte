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
		<slot>back to top</slot>
	</button>
{/if}

<svelte:window bind:scrollY={scrollHeight} />

<style lang="scss" global>
	.back-to-top {
		position: fixed;
		right: 1rem;
		bottom: 1rem;
		cursor: pointer;
		transition-duration: 300ms;
		z-index: 999;
		background-color: transparent;
		border: none;
		padding: 0;
        &:focus{
            border:none;
        }
		&:hover {
			transform: translateY(-10px);
			background-color: transparent;
            * {
                background-color: transparent;
            }
		}

	}
</style>
