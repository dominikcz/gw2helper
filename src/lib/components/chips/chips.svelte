<script lang="ts">
	import wxjs_types from '$lib/wxjs_types';
	import { update } from 'idb-keyval';
	import Chip from './chip.svelte';

	export let name: string;
	export let id: string = '';
	export let help: string = '';
	export let options: object = {};
	export let value = [];
	export let label: string;
	export let className: string = '';

	let choice = [];

	// DC: normalizacja modelu
	// options może być:
	// - obiektem  { value1: label1, value2: label2, ... }
	// - tablicą obiektów: [ { value: value1, label: label1, checked: true}, ...]
	// - null
	if (wxjs_types.isObject(options)) {
		Object.entries(options).forEach(([key, label]) => {
			choice.push({
				value: key,
				label: label,
				help: '',
				selected: false,
			});
		});
	} else if (wxjs_types.isArray(options)) {
		options.forEach((item) => {
			choice.push(item);
			if (item.selected) {
				value.push(item.value);
			}
		});
	} else {
		value = false;
	}

	function updateValue() {
		console.log('updateValue');
		value = choice.filter((item) => item.selected).map((item) => item.value);
	}

	$: choice, updateValue();

</script>

<div class="formkit-chips">
	{#each choice as item}
		<Chip bind:selected={item.selected} id={item.id} name={item.name} value={item.value} label={item.label} title={item.help || help} />
	{/each}
</div>
