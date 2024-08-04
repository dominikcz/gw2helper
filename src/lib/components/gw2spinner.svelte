<div class="spinner">
</div>

<style>
	.spinner {
		width: 4em;
		height: 4em;
		background: url('/gw2helper/assets/loading_gray_inv.png') no-repeat 0 0/248em 4em;
        animation: sprites 2.2s steps(62) infinite reverse;
	}

	@keyframes sprites {
		0% {
			background-position: 0;
		}
		80% {
			background-position: -248em;
		}
		100% {
			background-position: -248em;
		}
	}

	@media (prefers-color-scheme: dark) {
		.spinner{
			background: url('/gw2helper/assets/loading_gray.png') no-repeat 0 0/248em 4em;
		}
	}
</style>
