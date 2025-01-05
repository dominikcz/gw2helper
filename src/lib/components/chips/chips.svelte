<script lang="ts">
	import wxjs_types from '$lib/wxjs_types';
	import Chip from './chip.svelte';

	interface Props {
		name?: string;
		help?: string;
		options?: object;
		value?: any;
		className?: string;
		onChipsChange: CallableFunction;
	}

	let {
		name = '',
		help = '',
		options = {},
		value = $bindable([]),
		className = '',
		onChipsChange = () => {},
	}: Props = $props();

	let choice = $state([]);

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
		value = choice.filter((item) => item.selected).map((item) => item.value).sort();
		onChipsChange({
			name,
			value,
			trigger: ev,
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
			onChipToggle={hndToggleChip}
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
