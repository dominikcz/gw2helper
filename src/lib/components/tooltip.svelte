<script>
	export let title = '';
	let x;
	let y;

	function mouseOver(event) {
		const _title = event.target.getAttribute('data-title');
		title = _title ? _title : '';
	}

	function mouseMove(event) {
		x = event.pageX;
		y = event.pageY;
	}

	function mouseLeave() {
		title = '';
	}

    function touchHandler(event) {
        event.preventDefault();
        x = event.target.clientLeft + 20;
        y = event.target.clientTop + 5;
    }

	function loaded() {
		let count = 0;
		const elems = document.querySelectorAll('[title]');
		elems.forEach((elem) => {
			const t = elem.getAttribute('title');
			// console.log('onMount', {t, elem})
			elem.title = '';
			elem.setAttribute('data-title', t);
            elem.setAttribute('ontouchstart', touchHandler)
			count++;
		});
		console.log('prepared tooltips', count);
	}
</script>

<svelte:window on:mouseover={mouseOver} on:mouseleave={mouseLeave} on:mousemove={mouseMove} on:load={loaded} />

{#if title}
	<div style="left: {x + 15}px; top: {y + 5}px;">
		{@html title}
	</div>
{/if}

<style>
	div {
		border: 1px solid #ddd;
		box-shadow: var(--gw2helper-module-shadow);
		background: white;
		border-radius: 5px;
		padding: 10px;
		position: absolute;
		max-width: 320px;
		z-index: 1000;
	}
</style>
