<div class="spinner">
</div>

<style>
	.spinner {
		width: 64px;
		height: 64px;
		background: url('/gw2helper/assets/loading_gray_inv.png') no-repeat 0 0/3968px 64px;
        animation: sprites 2.2s steps(62) infinite reverse;
	}

	@keyframes sprites {
		0% {
			background-position: 0;
		}
		80% {
			background-position: -3968px;
		}
		100% {
			background-position: -3968px;
		}
	}
</style>
