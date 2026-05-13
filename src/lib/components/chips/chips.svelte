<script lang="ts">
	import wxjs_types from '$lib/wxjs_types';
	import Chip from './chip.svelte';

	type ChipValue = string | number;
	type ChipOption = {
		id?: string;
		name?: string;
		value: ChipValue;
		label: string;
		help?: string;
		selected?: boolean;
	};

	interface Props {
		name?: string;
		help?: string;
		options?: Record<string, string> | Array<ChipOption | string>;
		value?: ChipValue[];
		className?: string;
		onChipsChange?: (payload: { name: string; value: ChipValue[]; trigger: Event }) => void;
	}

	let {
		name = '',
		help = '',
		options = {},
		value = $bindable([]),
		className = '',
		onChipsChange = () => {},
	}: Props = $props();

	let choice = $state<ChipOption[]>([]);

	// data model's normalization
	// `options` might be:
	// - an object  { value1: label1, value2: label2, ... }
	// - an array of objects: [ { value: value1, label: label1, checked: true}, ... ]
	// - an array of strings: ['label 1', 'label2', ... ]
	// svelte-ignore state_referenced_locally
	if (wxjs_types.isObject(options)) {
		// svelte-ignore state_referenced_locally
		Object.entries(options as Record<string, string>).forEach(([key, label]) => {
			choice.push({
				value: key,
				label: label,
				help: '',
				selected: false,
			});
		});
	// svelte-ignore state_referenced_locally
	} else if (wxjs_types.isArray(options)) {
		// svelte-ignore state_referenced_locally
		(options as Array<ChipOption | string>).forEach((item) => {
			const _item: ChipOption = wxjs_types.isObject(item)
				? (item as ChipOption)
				: {
						value: item as ChipValue,
						label: String(item),
						name: String(item),
						help: '',
						selected: value.includes(item as ChipValue),
					};
			choice.push(_item);
			if (_item.selected) {
				value.push(_item.value);
			}
		});
	} else {
		value = [];
	}

	function hndToggleChip(_ev: { name: string; id: string; label: string; title?: string; value: ChipValue; selected: boolean }) {
		value = choice.filter((item) => item.selected).map((item) => item.value).sort();
		onChipsChange({
			name,
			value,
			trigger: new Event('chip-toggle'),
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
		-webkit-user-select: none;
		-moz-user-select: none;
		user-select: none;
	}
</style>
