<script>
	import { afterNavigate } from '$app/navigation';
	export let title = '';

	let x;
	let y;
	let ref;
	let autotooltipClass = '';

	$: visible = title != '';

	afterNavigate((_navigation) => {
		_navigation.complete.then(() => loaded());
	});

	function mouseOver(event) {
		let elem = event.target;
		let _title = '';
		let _class = '';
		let __class = '';
		// looking up hierarchy
		do {
			_title = elem.getAttribute('data-autotooltip');
			__class = elem.getAttribute('data-autotooltip-class');
			if (__class) {
				_class = __class;
			}
			if (!_title) {
				elem = elem.parentElement;
			}
		} while (!_title && elem != null);

		title = _title ? _title : '';
		autotooltipClass = _class;
		mouseMove(event);
		event.stopPropagation();
	}

	function touchStart(event) {
		mouseOver(event);
		if (event.target.classList.contains('autotooltip')) {
			event.preventDefault();

			const rect = event.target.getBoundingClientRect();
			x = event.layerX + rect.x + 40;
			y = event.layerY + rect.y + 5;
			updateXY()
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
		x = event.pageX + 15;
		y = event.pageY + 5;
		updateXY();
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

	async function updateXY() {
		if (ref) {
			const rect = ref.getBoundingClientRect();

			let newX = x;
			let newY = y;
			if (newX + rect.width > window.innerWidth) {
				newX = window.innerWidth - rect.width - 10;
			}
			if (newY + rect.height > window.innerHeight + window.scrollY){
				newY = y - rect.height - 10; 
			}
			ref.style.left = `${newX}px`;
			ref.style.top = `${newY}px`;
		}
	}
</script>

<svelte:window on:mouseover|capture={mouseOver} on:mouseleave={mouseLeave} on:mousemove|capture={mouseMove} on:touchstart|nonpassive={touchStart} />

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions svelte-ignore a11y-no-static-element-interactions-->
<div bind:this={ref} on:touchstart={tooltipTouchStart} class:visible class={autotooltipClass} >
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
		overflow: clip;
		display: none;
		&.visible {
			display: block;
		}
	}
	:global(.autotooltip-link) {
		font-size: smaller;
	}
</style>
