<script>
    export let items = [];
    export let active;
</script>

<div class="nav-container">
    <nav id="main-nav">
        {#each items as item, i}
        {#if !!item.visible}
        <a href={item.slug} data-sveltekit-preload-data="tap" class:active={active == item.slug}>{item.label}</a>
        {/if}
        {/each}
    </nav>
</div>

<style lang="scss">
	.nav-container{
		display: block;
		max-width: 800px;
        background-color: #222;
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
		a {
			padding: 0.3rem 1rem;
            color: #aaa;
			text-decoration: none;
			// border-radius: 5px;
			&:hover{
				border-bottom: 4px dotted #fff;
				color: #fff;
			}
			&.active{
				border-bottom: 4px solid #fff;
				color: #fff;
                cursor: auto;
			}
		}

	}

	@media (min-width: 900px) {
		.nav-container{
			max-width: none;
		}
	}
    </style>