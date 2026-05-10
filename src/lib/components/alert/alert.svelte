<script lang="ts">
	// based on https://developer.mozilla.org/en-US/docs/Learn/Tools_and_testing/Client-side_JavaScript_frameworks/Svelte_stores
    import { alert } from './alert';
    import Modal from '$lib/components/modal.svelte';

    let visible = $derived($alert !== '');

    function hndCloseModal(){
        $alert = '';
    }
</script>

<Modal showModal={visible} onModalClose={hndCloseModal}>{@html $alert}</Modal>
