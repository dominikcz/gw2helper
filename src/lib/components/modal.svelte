<script>
	import { run, self, createBubbler, stopPropagation } from 'svelte/legacy';

	const bubble = createBubbler();
	// based on https://svelte.dev/examples/modal
    import { createEventDispatcher } from 'svelte';

	/** @type {{showModal: any, header?: import('svelte').Snippet, children?: import('svelte').Snippet}} */
	let { showModal = $bindable(), header, children } = $props();

    const dispatch = createEventDispatcher();

	let dialog = $state(); // HTMLDialogElement

	run(() => {
		if (dialog && showModal) dialog.showModal();
	});

    function hndClose(){
        dialog.close();
        showModal = false;
        dispatch('modal-close');
    }
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog bind:this={dialog} onclose={hndClose} onclick={self(hndClose)} >
	<!-- svelte-ignore a11y_no_static_element_interactions -->
	<div onclick={stopPropagation(bubble('click'))}>
		{@render header?.()}
		{@render children?.()}
		<!-- svelte-ignore a11y_autofocus -->
		<button autofocus onclick={hndClose}>OK</button>
	</div>
</dialog>

<style>
	dialog {
		max-width: 32em;
		border-radius: 0.2em;
		border: none;
		padding: 1em;
        background-color: var(--gw2helper-module-white);
        color: var(--gw2helper-module-text);
	}
	dialog::backdrop {
		background: rgba(0, 0, 0, 0.3);
	}
	dialog > div {
		padding: 1em;
	}
	dialog[open] {
		animation: zoom 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
	}
	@keyframes zoom {
		from {
			transform: scale(0.95);
		}
		to {
			transform: scale(1);
		}
	}
	dialog[open]::backdrop {
		animation: fade 0.2s ease-out;
	}
	@keyframes fade {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}
	button {
		display: block;
	}
</style>
