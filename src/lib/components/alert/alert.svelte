<script>
	// based on https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Client-side_JavaScript_frameworks/Svelte_stores
	import { onDestroy } from 'svelte';
	import { alert } from './alert.js';
    import Modal from '$lib/components/modal.svelte';

    let visible;

	const hndMessageChange = (message) => {
		visible = message !== '';
	};
    
	$: hndMessageChange($alert);

	onDestroy(() => {
        visible = false;
    }); 

    function hndCloseModal(){
        $alert = '';
    }
</script>

<Modal showModal={visible} on:modal-close={hndCloseModal}>{@html $alert}</Modal>
