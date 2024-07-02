<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	export let emblem;
	export let width = 128;
	export let height = 128;
	export let background = '#000';

	let canvas: HTMLCanvasElement;
	let ctx: CanvasRenderingContext2D | null;

	interface LayerData {
		img: HTMLImageElement;
		flipH: boolean;
		flipV: boolean;
	}

	$: {
		prepareEmblem();
	}

	function renderImages(images: Array<LayerData>) {
		images.forEach((item) => {
			const scaleH = item.flipH ? -1 : 1;
			const scaleV = item.flipV ? -1 : 1;
			const posX = item.flipH ? width * -1 : 0;
			const posY = item.flipV ? height * -1 : 0;

			if (ctx) {
				ctx.save();
				ctx.scale(scaleH, scaleV);
				ctx.drawImage(item.img, posX, posY, width, height);
				ctx.restore();
			}
		});
	}

	function loadImage(url: string, flipH: boolean = false, flipV: boolean = false) {
		return new Promise<LayerData>((resolve) => {
			const img = new Image();
			img.addEventListener('load', () => {
				resolve({ img, flipH, flipV });
			});
			img.src = url;
		});
	}

	async function prepareEmblem() {
		if (ctx && emblem) {
			ctx.fillStyle = background;
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			const tasks = Array<Promise<LayerData>>();
			emblem.background.layers.forEach((layer: string) => {
				tasks.push(loadImage(layer, emblem.flags.includes('FlipBackgroundHorizontal'), emblem.flags.includes('FlipBackgroundVertical')));
			});

			emblem.foreground.layers.forEach((layer: string) => {
				tasks.push(loadImage(layer, emblem.flags.includes('FlipForegroundHorizontal'), emblem.flags.includes('FlipForegroundVertical')));
			});
			renderImages(await Promise.all(tasks));
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
