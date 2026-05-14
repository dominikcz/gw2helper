<script lang="ts">
	import { nonpassive } from 'svelte/legacy';

	import { autoTooltipInit } from './autotooltip-utils';
	import type { AutoTooltipRenderer } from './autotooltip-utils';

	interface Props {
		title?: string;
	}

	let { title = $bindable('') }: Props = $props();

	let customContent = false;
	let visible = $state(title != '');

	let x = 0;
	let y = 0;
	let ref = $state<HTMLDivElement | null>(null);
	let autotooltipClass = $state('');

	let touchStartTime = 0;
	let touchEventIsTap = false;
	let touchInProgress = false;
	let touchX: number | undefined;
	let touchY: number | undefined;
	let left = $state(false);
	let above = $state(false);
	let vertical = $state(false);
	let under = $state(false);
	let sticky = $state(true);
	let lastTappedTooltipHref: string | null = null;
	let lastTappedTooltipTime = 0;

	let touchMode = 'ontouchstart' in window;

	window.__autotooltip = {
		customRenderers: {},
	};

	function processCustomRenderers(node: Element): boolean {
		const id = node.getAttribute('data-autotooltip-id')
		const customRendererId = node.getAttribute('data-autotooltip-renderer') || '';
		// console.log('customRendererId', customRendererId, node)
		if (customRendererId) {
			const renderer = window.__autotooltip?.customRenderers?.[customRendererId] as AutoTooltipRenderer | undefined;
			let params: unknown = id;
			const strParams = node.getAttribute('data-autotooltip-params');
			if (strParams){
				params = JSON.parse(strParams);
			}
			// console.log('autotooltip', customRendererId, window.__autotooltip.customRenderers, params);
			if (renderer && ref) {
				ref.textContent = '';
				return (renderer(ref, id, params) === false) ? false : true;
			}
		} else {
			if (customContent && ref) {
				ref.textContent = '';
			}
		}
		return false;
	}

	function handlingTouch(event: MouseEvent | TouchEvent): boolean {
		const result = touchInProgress || touchMode;
		if (result) {
			event.preventDefault();
			event.stopPropagation();
			if ('touches' in event && event.type.startsWith('touch') && event.touches.length) {
				touchX = event.touches[0].pageX;
				touchY = event.touches[0].pageY;
			} else {
				touchX = (event as MouseEvent).pageX + 15;
				touchY = (event as MouseEvent).pageY + 5;
			}
			// console.log('touch updated', touchX, touchY);
		}
		return result;
	}

	// #region mouse events

	function mouseUp(_event: MouseEvent) {
		touchInProgress = false;
		touchEventIsTap = false;
	}

	function mouseOver(event: MouseEvent) {
		let elem = event.target as HTMLElement | null;
		if (!elem) return;
		if (elem.closest?.('._toastContainer')) {
			visible = false;
			return;
		}
		// Don't hide tooltip when cursor is over the tooltip itself
		if (ref && ref.contains(elem)) {
			return;
		}
		findTitle(elem);
		updateXY(event);
		// mouseMove(event);
		event.stopPropagation();
	}

	function mouseMove(event: MouseEvent) {
		const target = event.target as HTMLElement | null;
		if (!target) return;
		if (target.closest?.('._toastContainer')) {
			return;
		}
		// Don't reposition when cursor is over the tooltip itself
		if (ref && ref.contains(target)) {
			return;
		}
		updateXY(event);
	}

	function mouseLeave(_event: MouseEvent) {
		// if (!handlingTouch(event)) {
		// 	title = '';
		// }
	}

	//#endregion
	// #region touch events

	function touchStart(_event: TouchEvent) {
		touchInProgress = true;
		touchStartTime = new Date().getTime();
		touchEventIsTap = true;
		// console.log('touch start', event);
	}

	function touchMove(event: TouchEvent) {
		event.preventDefault();
		// console.log(event);
		touchEventIsTap = false;
	}

	function touchEnd(event: TouchEvent) {
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

			const target = event.target as HTMLElement | null;
			if (target && ref && ref.contains(target)) {
				touchEventIsTap = false;
				touchInProgress = false;
				return;
			}
			if (target?.closest?.('._toastContainer')) {
				visible = false;
			} else if (findTitle(target)) {
				updateXY(event);
			}
		}
		touchEventIsTap = false;
		touchInProgress = false;
	}

	function touchCancel(event: TouchEvent) {
		touchInProgress = false;
		event.preventDefault();
	}

	function clickCapture(event: MouseEvent) {
		const elem = event.target as HTMLElement | null;
		if (!elem || !touchMode || elem.closest?.('._toastContainer')) {
			return;
		}

		const anchor = elem.closest?.('a[href]') as HTMLAnchorElement | null;
		if (!anchor) {
			return;
		}

		// Links rendered inside the tooltip body must remain directly clickable.
		if (ref && ref.contains(anchor)) {
			return;
		}

		if (!elem.closest?.('.autotooltip')) {
			return;
		}

		if (!findTitle(elem)) {
			return;
		}

		const now = Date.now();
		const href = anchor.href || anchor.getAttribute('href') || null;
		const sameLink = Boolean(href && href === lastTappedTooltipHref);
		const secondTap = sameLink && now - lastTappedTooltipTime < 1500;

		if (secondTap) {
			lastTappedTooltipHref = null;
			lastTappedTooltipTime = 0;
			return;
		}

		event.preventDefault();
		event.stopPropagation();
		updateXY(event);
		lastTappedTooltipHref = href;
		lastTappedTooltipTime = now;
	}

	function tooltipTouchStart(event: TouchEvent) {
		const target = event.target as HTMLAnchorElement | null;
		if (!target?.href) {
			event.stopPropagation();
			event.preventDefault();
			// title = '';
		}
	}

	function tooltipClickCapture(event: MouseEvent) {
		if (!touchMode) return;
		const target = event.target as HTMLElement | null;
		if (!target) return;

		const anchor = target.closest?.('a[href]') as HTMLAnchorElement | null;
		if (!anchor) {
			event.stopPropagation();
			event.preventDefault();
			return;
		}

		event.stopPropagation();
		event.preventDefault();

		const href = anchor.href || anchor.getAttribute('href');
		if (!href) return;

		if (anchor.target === '_blank') {
			window.open(href, '_blank', 'noopener,noreferrer');
			return;
		}

		window.location.assign(href);
	}

	//#endregion

	function checkIfSticky(elem: HTMLElement | null): boolean {
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

	function findTitle(elem: HTMLElement | null): boolean {
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
					_title = elem.getAttribute('data-autotooltip') || '';
					__class = elem.getAttribute('data-autotooltip-class') || '';
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
				if (!customContent && ref) {
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

	function updateXY(event: MouseEvent | TouchEvent) {
		const distance = 5;
		const offset = 3;

		const getPageCoordinates = (evt: MouseEvent | TouchEvent) => {
			if ('touches' in evt && evt.touches.length) {
				return {
					pageX: evt.touches[0].pageX,
					pageY: evt.touches[0].pageY,
				};
			}
			if ('changedTouches' in evt && evt.changedTouches.length) {
				return {
					pageX: evt.changedTouches[0].pageX,
					pageY: evt.changedTouches[0].pageY,
				};
			}
			return {
				pageX: ('pageX' in evt ? evt.pageX : touchX) ?? 0,
				pageY: ('pageY' in evt ? evt.pageY : touchY) ?? 0,
			};
		};

		// by default set to right side
		const targetElement = event.target as HTMLElement | null;
		if (ref && targetElement && targetElement.nodeType == Node.ELEMENT_NODE) {
			// measure natural dimensions by temporarily positioning tooltip where it has room
			ref.style.left = '0px';
			ref.style.top = '0px';
			const rect = ref.getBoundingClientRect();

			const elemRect = targetElement.getBoundingClientRect();
			const target = {
				x: elemRect.left,
				y: elemRect.top,
				width: elemRect.width,
				height: elemRect.height,
			};
			const targetPageY = window.scrollY + target.y;
			const pointer = getPageCoordinates(event);
			// console.log('updateXY', target);

			if (!sticky) {
				x = pointer.pageX + 15;
				y = pointer.pageY + 5;
			} else {
				x = target.x + target.width + offset + distance;
				y = targetPageY - offset;
			}

			let newX = x;
			let newY = y;
			let placement = 'right';
			const pageTop = window.scrollY;
			const pageBottom = pageTop + window.innerHeight;

			if (sticky) {
				const rightX = target.x + target.width + offset + distance;
				const leftX = target.x - rect.width - distance - offset;
				const rightFits = rightX + rect.width <= window.innerWidth - distance;
				const leftFits = leftX >= distance;

				if (rightFits) {
					newX = rightX;
				} else if (leftFits) {
					newX = leftX;
					placement = 'left';
				} else {
					// On small screens, prefer vertical placement instead of squeezing tooltip horizontally.
					const tooltipAboveY = pageTop + target.y - rect.height - distance - offset;
					const tooltipBelowY = pageTop + target.y + target.height + distance + offset;
					const spaceAbove = target.y - distance;
					const spaceBelow = window.innerHeight - (target.y + target.height) - distance;
					const placeBelow = spaceBelow >= rect.height || spaceBelow >= spaceAbove;

					newX = target.x + target.width / 2 - rect.width / 2;
					newY = placeBelow ? tooltipBelowY : tooltipAboveY;
					placement = placeBelow ? 'below' : 'above';
				}

				if (placement === 'right' || placement === 'left') {
					if (newY + rect.height > pageBottom) {
						newY = pageTop + target.y + target.height - rect.height + offset;
					}
				}
			} else {
				// if it doesn't fit on the right, clamp to right edge of viewport
				if (newX + rect.width > window.innerWidth) {
					newX = window.innerWidth - rect.width - distance;
				}
				// if it doesn't fit below, place above cursor
				if (newY + rect.height > window.innerHeight + window.scrollY) {
					newY = y - rect.height - distance;
				}
			}

			const minX = distance;
			const maxX = window.innerWidth - rect.width - distance;
			if (maxX >= minX) {
				newX = Math.min(Math.max(newX, minX), maxX);
			} else {
				newX = minX;
			}

			const minY = pageTop + distance;
			const maxY = pageBottom - rect.height - distance;
			if (maxY >= minY) {
				newY = Math.min(Math.max(newY, minY), maxY);
			} else {
				newY = minY;
			}

			ref.style.left = `${newX}px`;
			ref.style.top = `${newY}px`;

			const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);
			const arrowMargin = 12;
			const targetCenterX = target.x + target.width / 2;
			const targetCenterY = pageTop + target.y + target.height / 2;
			const maxArrowX = Math.max(arrowMargin, rect.width - arrowMargin);
			const maxArrowY = Math.max(arrowMargin, rect.height - arrowMargin);
			const arrowX = clamp(targetCenterX - newX, arrowMargin, maxArrowX);
			const arrowY = clamp(targetCenterY - newY, arrowMargin, maxArrowY);
			ref.style.setProperty('--autotooltip-arrow-x', `${arrowX}px`);
			ref.style.setProperty('--autotooltip-arrow-y', `${arrowY}px`);

			left = sticky && placement === 'left';
			vertical = sticky && (placement === 'above' || placement === 'below');
			under = sticky && placement === 'below';
			above = sticky && !vertical && newY - window.scrollY < target.y - distance;
		}
	}

	autoTooltipInit(document);
</script>

<svelte:window
	onmouseovercapture={mouseOver}
	onmouseleave={mouseLeave}
	onmousemovecapture={mouseMove}
	onclickcapture={clickCapture}
	use:nonpassive={['touchstart', () => touchStart as EventListener]}
	ontouchmove={touchMove}
	ontouchend={touchEnd}
	ontouchcancel={touchCancel}
/>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions, a11y_no_static_element_interactions-->
<div bind:this={ref} ontouchstart={tooltipTouchStart} onclickcapture={tooltipClickCapture} class:visible class:left class:above class:vertical class:under class:sticky class={autotooltipClass}>
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
				top: var(--autotooltip-arrow-y, 1em);
				left: -20px;
				transform: none;
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
					top: var(--autotooltip-arrow-y, 1em);
					bottom: auto;
				}
			}
			&.vertical {
				&::after {
					top: 100%;
					bottom: auto;
					left: var(--autotooltip-arrow-x, 50%);
					transform: translateX(-50%);
					border-color: white transparent transparent transparent;
				}

				&.under {
					&::after {
						top: -20px;
						left: var(--autotooltip-arrow-x, 50%);
						border-color: transparent transparent white transparent;
					}
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
