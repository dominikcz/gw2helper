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
	}
	nav {
		margin: 0.5rem 1rem;
		display: flex;
		flex-flow: row nowrap;
		overflow-x: auto;
		-webkit-overflow-scrolling: touch;
		gap: 2rem;
		padding-bottom: 0.5rem;
		a {
			padding: 0.3rem 1rem;
			border: 1px solid #ccc;
			background-color: #fff;
			text-decoration: none;
			border-radius: 5px;
			&:hover{
				background-color: #555;
				color: #fff;
			}
			&.active{
				background-color: #333;
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