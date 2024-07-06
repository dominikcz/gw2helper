<script>
	import { afterNavigate } from '$app/navigation';
	export let title = '';

	let x;
	let y;
	let ref;

	$: visible = title != '';

	afterNavigate((_navigation) => {
		_navigation.complete.then(() => loaded());
	});

	function mouseOver(event) {
		let elem = event.target;
		let _title = '';
		// looking up hierarchy
		do {
			_title = elem.getAttribute('data-autotooltip');
			if (!_title) {
				elem = elem.parentElement;
			}
		} while (!_title && elem != null);

		title = _title ? _title : '';
		updateXY(event.pageX, event.pageY);
		event.stopPropagation();
	}

	function touchStart(event) {
		mouseOver(event);
		if (event.target.classList.contains('autotooltip')) {
			event.preventDefault();

			const rect = event.target.getBoundingClientRect();
			x = event.layerX + rect.x + 40;
			y = event.layerY + rect.y - 5;
		}
	}

	function tooltipTouchStart(event) {
		if (!event.target.href) {
			event.stopPropagation();
			event.preventDefault();
			title = '';
		}
	}

	function mouseMove(event) {
		updateXY(event.pageX, event.pageY);
	}

	function mouseLeave() {
		title = '';
	}

	function loaded() {
		let count = 0;
		document.querySelectorAll('.autotooltip[title]').forEach((elem) => {
			const t = elem.getAttribute('title');
			elem.setAttribute('title', '');
			if (t && !elem.getAttribute('data-autotooltip')) {
				elem.setAttribute('data-autotooltip', t);
				count++;
			}
		});
		console.log('autotooltip', count);
	}

	async function updateXY(evX, evY) {
		if (ref) {
			const rect = ref.getBoundingClientRect();

			x = evX + 10;
			y = evY - 5;
			
			//nice, but flickers :(
			// if (rect.x + rect.width + 5 > window.innerWidth) {
			// 	x = window.innerWidth - rect.width - 10;
			// }
			// if (rect.y + rect.height + 5 > window.innerHeight){
			// 	y = evY - rect.height - 10; 
			// }
		}
	}
</script>

<svelte:window on:mouseover|capture={mouseOver} on:mouseleave={mouseLeave} on:mousemove|capture={mouseMove} on:touchstart={touchStart} />

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions svelte-ignore a11y-no-static-element-interactions-->
<div bind:this={ref} on:touchstart={tooltipTouchStart} class:visible style="top: {y}px; left: {x}px;">
	{@html title}
</div>

<style lang="scss">
	div {
		border: 1px solid #ddd;
		box-shadow: var(--gw2helper-module-shadow);
		background: white;
		border-radius: 5px;
		padding: 10px;
		position: absolute;
		min-width: 100px;
		max-width: 300px;
		z-index: 1000;
		overflow: scroll;
		display: none;
		&.visible {
			display: block;
		}
	}
	:global(.autotooltip-link) {
		font-size: smaller;
	}
</style>
