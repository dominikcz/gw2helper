<script>
	import { nonpassive } from 'svelte/legacy';

	import { autoTooltipInit } from './autotooltip-utils';

	/** @type {{title?: string}} */
	let { title = $bindable('') } = $props();

	let customContent = false;
	let visible = $state(title != '');

	let x;
	let y;
	let ref = $state();
	let autotooltipClass = $state('');

	let touchStartTime;
	let touchEventIsTap;
	let touchInProgress;
	let touchX;
	let touchY;
	let left = $state(false);
	let above = $state(false);
	let sticky = $state(true);

	let touchMode = 'ontouchstart' in window;

	window.__autotooltip = {
		customRenderers: {},
	};

	function processCustomRenderers(node) {
		const id = node.getAttribute('data-autotooltip-id')
		const customRendererId = node.getAttribute('data-autotooltip-renderer') || '';
		// console.log('customRendererId', customRendererId, node)
		if (customRendererId) {
			const renderer = window.__autotooltip.customRenderers[customRendererId];
			let params = id;
			const strParams = node.getAttribute('data-autotooltip-params');
			if (strParams){
				params = JSON.parse(strParams);
			}
			// console.log('autotooltip', customRendererId, window.__autotooltip.customRenderers, params);
			if (renderer) {
				ref.textContent = '';
				return (renderer(ref, id, params) === false) ? false : true;
			}
		} else {
			if (customContent) {
				ref.textContent = '';
			}
		}
		return false;
	}

	function handlingTouch(event) {
		const result = touchInProgress || touchMode;
		if (result) {
			event.preventDefault();
			event.stopPropagation();
			if (event.type.startsWith('touch') && event.touches.length) {
				touchX = event.touches[0].pageX;
				touchY = event.touches[0].pageY;
			} else {
				touchX = event.pageX + 15;
				touchY = event.pageY + 5;
			}
			// console.log('touch updated', touchX, touchY);
		}
		return result;
	}

	// #region mouse events

	function mouseUp(event) {
		touchInProgress = false;
		touchEventIsTap = false;
	}

	function mouseOver(event) {
		let elem = event.target;
		findTitle(elem);
		updateXY(event);
		// mouseMove(event);
		event.stopPropagation();
	}

	function mouseMove(event) {
		updateXY(event);
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
		// console.log('touch start', event);
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
			// console.log('touchended', event);

			if (findTitle(event.target)) {
				updateXY(event);
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

	function checkIfSticky(elem) {
		if (elem == null) return false;
		// looking up hierarchy
		try {
			let _sticky = false;
			do {
				if (elem.classList.contains('autotooltip-sticky')) {
					_sticky = true;
					break;
				}
				elem = elem.parentElement;
			} while (!_sticky && elem != null);
			sticky = _sticky;
		} catch (error) {
			console.warn('checkIfSticky', { elem, error });
			return false;
		}
		return sticky;
	}

	function findTitle(elem) {
		let _title = '';
		let _class = '';
		let __class = '';

		if (elem == null) return false;
		// looking up hierarchy
		try {
			let _visible = false;
			const _sticky = checkIfSticky(elem);
			do {
				customContent = processCustomRenderers(elem);
				if (customContent) {
					_visible = true;
					break;
				} else {
					_title = elem.getAttribute('data-autotooltip');
					__class = elem.getAttribute('data-autotooltip-class');
					if (__class) {
						_class = __class;
					}
					if (!_title) {
						if (elem.classList.contains('autotooltip') && ((_title && _title.length > 0) || customContent)) {
							_visible = true;
						}
						elem = elem.parentElement;
					} else {
						_visible = true;
					}
					autotooltipClass = _class;
				}
				// console.log('__', {_title, _visible, customContent})
			} while (!_title && elem != null);
			if (_visible) {
				if (!customContent) {
					title = _title;
					ref.innerHTML = _title;
				}
			}
			visible = _visible && ((_title && _title.length > 0) || customContent);
			// console.log('_##_', {visible, _title, title, _visible, customContent})
			sticky = _sticky;
		} catch (error) {
			console.warn('autotooltip', { elem, error });
			return false;
		}
		return visible;
	}

	function updateXY(event) {
		const distance = 5;
		const offset = 3;

		// by default set to right side
		if (ref && event.target.nodeType == Node.ELEMENT_NODE) {
			const rect = ref.getBoundingClientRect();

			const elemRect = event.target.getBoundingClientRect();
			const target = {
				x: elemRect.left,
				y: elemRect.top,
				width: elemRect.width,
				height: elemRect.height,
			};
			// console.log('updateXY', target);

			if (!sticky) {
				x = event.pageX + 15;
				y = event.pageY + 5;
			} else {
				x = target.x + target.width + offset + distance;
				if (handlingTouch(event)) {
					y = event.pageY - touchY + target.y - offset;
				} else {
					// x = event.pageX + 15;
					// y = event.pageY + 5;
					y = event.pageY - event.y + target.y - offset;
				}
			}

			let newX = x;
			let newY = y;

			if (sticky) {
				// if it doesn't fit horizontally on right side, try placing tooltip on left side of the element
				if (newX + rect.width > window.innerWidth && target.x - rect.width > distance + offset) {
					newX = target.x - rect.width - distance - offset;
				}
				// if it doesn't fit below, try placing tooltip on top of the element
				if (newY + rect.height > window.innerHeight + window.scrollY) {
					newY = event.pageY - event.y + target.y + target.height - rect.height + offset;
				}
			} else {
				// else try your best
				if (newY + rect.height > window.innerHeight + window.scrollY) {
					newY = y - rect.height - distance;
				}
			}
			// else try your best
			if (newX + rect.width > window.innerWidth) {
				newX = window.innerWidth - rect.width + distance;
			}

			if (newX && newY) {
				ref.style.left = `${newX}px`;
				ref.style.top = `${newY}px`;
			}

			left = sticky && newX < target.x;
			above = sticky && newY - window.scrollY < target.y - distance;
		}
	}

	autoTooltipInit();
</script>

<svelte:window
	onmouseovercapture={mouseOver}
	onmouseleave={mouseLeave}
	onmousemovecapture={mouseMove}
	use:nonpassive={['touchstart', () => touchStart]}
	ontouchmove={touchMove}
	ontouchend={touchEnd}
	ontouchcancel={touchCancel}
/>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions, a11y_no_static_element_interactions-->
<div bind:this={ref} ontouchstart={tooltipTouchStart} class:visible class:left class:above class:sticky class={autotooltipClass}>
</div>

<style lang="scss">
	div {
		border: 1px solid #ddd;
		box-shadow: var(--box-shadow-strong);
		background: var(--gw2helper-tooltip-background);
		color: var(--gw2helper-tooltip-text);
		border-radius: 0.3125em;
		padding: 0.625em;
		position: absolute;
		min-width: 6.25em;
		max-width: 18.75em;
		z-index: 1000;
		// overflow: clip;
		display: none;
		cursor: default;

		// transition: all 0.2s ease-in-out;

		&.sticky {
			&::after {
				content: ' ';
				position: absolute;
				top: 1em;
				left: -20px;
				border-width: 10px;
				border-style: solid;
				border-color: transparent white transparent transparent;
			}
			&.left {
				&::after {
					left: 100%;
					border-color: transparent transparent transparent white;
				}
			}
			&.above {
				&::after {
					top: auto;
					bottom: 1em;
				}
			}
		}
		&.visible {
			display: block;
		}
	}
	:global(.autotooltip-link) {
		color: skyblue;
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
