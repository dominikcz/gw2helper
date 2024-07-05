<script>
	import { base } from '$app/paths';
	import { afterNavigate } from '$app/navigation';
	
	export let title = '';
	let x;
	let y;

	afterNavigate((_navigation) => {
		_navigation.complete.then(() => loaded())		
	});

	function mouseOver(event) {
		const _title = event.target.getAttribute('data-title');
		title = _title ? _title : '';
		// console.log('event', event);
		if (event.touches != undefined) {
			const href = event.target.pathname;
			const regularLink = (href !== undefined && href.startsWith(base)) || event.target.classList.contains('tooltip-link');
			console.log('touched', { href, title: event.target.title, regularLink, dataTitle: event.target.getAttribute('data-title'), target: event.target });
			if (!regularLink) {
				event.preventDefault();
				x = (event.target.x || event.target.offsetLeft) + 40;
				y = (event.target.y || event.target.offsetTop) + 5;
			} else {
				console.log('dupa');
			}
		}
	}

	function mouseMove(event) {
		x = event.pageX;
		y = event.pageY;
	}

	function mouseLeave() {
		title = '';
	}

	function loaded() {
		let count = 0;
		document.querySelectorAll('[title]').forEach((elem) => {
			const t = elem.getAttribute('title');
			elem.setAttribute('title', '');
			if (t && !elem.getAttribute('data-title')) {
				elem.setAttribute('data-title', t);
				count++;
			}
		});
		console.log('prepared tooltips', count);
	}
</script>

<svelte:window on:mouseover={mouseOver} on:mouseleave={mouseLeave} on:mousemove={mouseMove} on:touchstart={mouseOver} />

{#if title}
	<div style="left: {x + 15}px; top: {y + 5}px;">
		{@html title}
	</div>
{/if}

<style lang="scss">
	div {
		border: 1px solid #ddd;
		box-shadow: var(--gw2helper-module-shadow);
		background: white;
		border-radius: 5px;
		padding: 10px;
		position: absolute;
		max-width: 360px;
		z-index: 1000;
		overflow: scroll;
	}
	:global(.tooltip-link) {
		font-size: smaller;
	}
</style>
