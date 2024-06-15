<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	export let emblem;
	export let width = 128;
	export let height = 128;
	export let background = '#000';

	let canvas;
	let ctx;

	$: {
		prepareEmblem();
	}

	function renderImage(url: string, flipH: boolean = false, flipV: boolean = false) {
		return new Promise((resolve, reject) => {
			const img = new Image();
			img.addEventListener('load', () => {
				const scaleH = flipH ? -1 : 1;
				const scaleV = flipV ? -1 : 1;
				const posX = flipH ? width * -1 : 0;
				const posY = flipV ? height * -1 : 0;

				ctx.save();
				ctx.scale(scaleH, scaleV);
				ctx.drawImage(img, posX, posY, width, height);
				ctx.restore();

				return resolve(img)
			});
			img.addEventListener('error', (err) => reject(err));
			img.src = url;
		})
	};

	function prepareEmblem() {
		if (ctx && emblem) {
			ctx.fillStyle = background;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			emblem.background.layers.forEach(async (layer) => {
				await renderImage(layer, emblem.flags.includes('FlipBackgroundHorizontal'), emblem.flags.includes('FlipBackgroundVertical'));
			});
			emblem.foreground.layers.forEach(async (layer) => {
				await renderImage(layer, emblem.flags.includes('FlipForegroundHorizontal'), emblem.flags.includes('FlipForegroundVertical'));
			});
		}
	}

	onMount(() => {
		ctx = canvas.getContext('2d');
	});

	onDestroy(() => {});

	$: if (ctx) {
		prepareEmblem();
	}
</script>

<canvas {width} {height} style:background bind:this={canvas} />
