<script>
	import { autoTooltipInit } from './autotooltip-utils';

	export let title = '';

	let customContent = false;

	let x;
	let y;
	let ref;
	let autotooltipClass = '';

	let touchStartTime;
	let touchEventIsTap;
	let touchInProgress;
	let touchLayerX;
	let touchLayerY;

	let touchMode = 'ontouchstart' in window;

	$: visible = title != '' || customContent;

	window.__autotooltip = {
		customRenderers: {},
	};

	function processCustomRenderers(node) {
		ref.textContent = '';
		const customRendererId = node.getAttribute('data-autotooltip-renderer') || '';
		if (customRendererId) {
			const renderer = window.__autotooltip.customRenderers[customRendererId];
			const params = JSON.parse(node.getAttribute('data-autotooltip-params') || {});
			// console.log('autotooltip', customRendererId, window.__autotooltip.customRenderers, params);
			renderer(ref, params);
			return true;
		}
		return false;
	}

	function handlingTouch(event) {
		const result = touchInProgress || touchMode;
		if (result) {
			event.preventDefault();
			event.stopPropagation();
		}
		return result;
	}

	// #region mouse events

	function mouseOver(event) {
		let elem = event.target;
		findTitle(elem);
		// mouseMove(event);
		event.stopPropagation();
	}

	function mouseMove(event) {
		if (!handlingTouch(event)) {
			// console.log('mouseMove', event);
			if (event.type.startsWith('touch') && event.touches.length) {
				x = event.touches[0].pageX;
				y = event.touches[0].pageY;
				// console.log('move', [x, y]);
			} else {
				x = event.pageX + 15;
				y = event.pageY + 5;
				updateXY();
			}
		}
	}

	function mouseLeave(event) {
		// if (!handlingTouch(event)) {
		// 	title = '';
		// }
	}

	//#endregion
	// #region touch events

	function touchStart(event) {
		touchInProgress = true;
		touchStartTime = new Date().getTime();
		touchEventIsTap = true;
		touchLayerX = event.layerX;
		touchLayerY = event.layerY;
		// console.log(event);
	}

	function touchMove(event) {
		event.preventDefault();
		// console.log(event);
		touchEventIsTap = false;
	}

	function touchEnd(event) {
		// console.log(event);
		if (touchEventIsTap) {
			let touchTimeLength = new Date().getTime() - touchStartTime;
			// console.log('dur', [touchTimeLength, event]);
			// if (touchTimeLength < 200) {
			// 	console.log('Short tap');
			// } else {
			// 	console.log('Long press');
			// }
			if (event.target.classList.contains('autotooltip')) {
				// console.log('touchended');
				event.preventDefault();

				const rect = event.target.getBoundingClientRect();
				findTitle(event.target);
				x = touchLayerX + rect.x + 40;
				y = touchLayerY + rect.y + 5;
				// console.log('ttt', [x, y, title]);
				updateXY();
			}
		}
		touchEventIsTap = false;
		touchInProgress = false;
	}

	function touchCancel(event) {
		touchInProgress = false;
		event.preventDefault();
	}

	function tooltipTouchStart(event) {
		if (!event.target.href) {
			event.stopPropagation();
			event.preventDefault();
			// title = '';
		}
	}

	//#endregion

	function findTitle(elem) {
		let _title = '';
		let _class = '';
		let __class = '';
		// looking up hierarchy
		try {
			let _visible = false;
			do {
				if (processCustomRenderers(elem)) {
					customContent = true;
					return;
				} else {
					_title = elem.getAttribute('data-autotooltip');
					__class = elem.getAttribute('data-autotooltip-class');
					if (__class) {
						_class = __class;
					}
					if (!_title) {
						elem = elem.parentElement;
					} else {
						title = _title;
						if (elem.classList.contains('autotooltip') && title) {
							_visible = true;
							console.log('visible', title);
						}
					}
					autotooltipClass = _class;
				}
			} while (!_title && elem != null);
			visible = _visible;
		} catch (error) {
			console.warn('autotooltip', { elem, error });
		}
	}

	function updateXY() {
		if (ref) {
			const rect = ref.getBoundingClientRect();

			let newX = x;
			let newY = y;
			if (newX + rect.width > window.innerWidth) {
				newX = window.innerWidth - rect.width - 10;
			}
			if (newY + rect.height > window.innerHeight + window.scrollY) {
				newY = y - rect.height - 10;
			}
			ref.style.left = `${newX}px`;
			ref.style.top = `${newY}px`;
		}
	}

	autoTooltipInit();
</script>

<svelte:window
	on:mouseover|capture={mouseOver}
	on:mouseleave={mouseLeave}
	on:mousemove|capture={mouseMove}
	on:touchstart|nonpassive={touchStart}
	on:touchmove={touchMove}
	on:touchend={touchEnd}
	on:touchcancel={touchCancel}
/>

<!-- svelte-ignore a11y-click-events-have-key-events a11y-no-noninteractive-element-interactions svelte-ignore a11y-no-static-element-interactions-->
<div bind:this={ref} on:touchstart={tooltipTouchStart} class:visible class={autotooltipClass}>
	{@html title}
</div>

<style lang="scss">
	div {
		border: 1px solid #ddd;
		box-shadow: var(--gw2helper-module-shadow);
		background: var(--gw2helper-module-white);
		color: var(--gw2helper-module-text);
		border-radius: 0.3125em;
		padding: 0.625em;
		position: absolute;
		min-width: 6.25em;
		max-width: 18.75em;
		z-index: 1000;
		overflow: clip;
		display: none;
		cursor: default;
		&.visible {
			display: block;
		}
	}
	:global(.autotooltip-link) {
		font-size: smaller;
		cursor: help;
	}

	@media (min-width: 900px) {
		div {
			max-width: 30em;
			width: 30em;
			overflow-wrap: break-word;
		}
	}
</style>
