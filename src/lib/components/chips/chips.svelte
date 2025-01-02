<script lang="ts">
	import { createEventDispatcher } from 'svelte';
	import wxjs_types from '$lib/wxjs_types';
	import Chip from './chip.svelte';

	interface Props {
		name?: string;
		help?: string;
		options?: object;
		value?: any;
		className?: string;
	}

	let {
		name = '',
		help = '',
		options = {},
		value = $bindable([]),
		className = ''
	}: Props = $props();

	let choice = $state([]);
	const dispatch = createEventDispatcher();

	// data model's normalization
	// `options` might be:
	// - an object  { value1: label1, value2: label2, ... }
	// - an array of objects: [ { value: value1, label: label1, checked: true}, ... ]
	// - an array of strings: ['label 1', 'label2', ... ]
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
			const _item = wxjs_types.isObject(item)
				? item
				: {
						value: item,
						label: item,
						name: item,
						help: '',
						selected: value.includes(item),
					};
			choice.push(_item);
			if (_item.selected) {
				value.push(_item.value);
			}
		});
	} else {
		value = false;
	}

	function hndToggleChip(ev) {
		const obj = ev.details;
		value = choice.filter((item) => item.selected).map((item) => item.value).sort();
		dispatch('chips-change', {
			name,
			value,
			trigger: obj,
		});
	}
</script>

<div class="formkit-chips {className}">
	{#each choice as item}
		<Chip
			bind:selected={item.selected}
			id={item.id}
			name={item.name}
			value={item.value}
			label={item.label}
			title={item.help || help}
			on:toggle-chip={hndToggleChip}
		/>
	{/each}
</div>

<style>
	.formkit-chips {
		display: flex;
		flex-flow: row wrap;
		gap: 0.5em;
	}
</style>
