<script lang="ts">
	import { onMount, onDestroy } from 'svelte';

	interface EmblemLayerSet {
		layers: string[];
	}

	interface GuildEmblem {
		background: EmblemLayerSet;
		foreground: EmblemLayerSet;
		flags: string[];
	}

	interface Props {
		emblem: GuildEmblem;
		width?: number;
		height?: number;
		background?: string;
	}

	let {
		emblem,
		width = 128,
		height = 128,
		background = '#000'
	}: Props = $props();

	let canvas: HTMLCanvasElement | null = $state(null);
	let ctx: CanvasRenderingContext2D | null = $state(null);

	interface LayerData {
		img: HTMLImageElement;
		flipH: boolean;
		flipV: boolean;
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
		if (ctx && emblem && canvas) {
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
		ctx = canvas?.getContext('2d') ?? null;
	});

	onDestroy(() => {});

	$effect(() => {
		if (ctx) {
			prepareEmblem();
		}
	});
</script>

<canvas {width} {height} style:background bind:this={canvas}></canvas>
