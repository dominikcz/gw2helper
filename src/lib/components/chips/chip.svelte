<script lang="ts">
	interface Props {
		name?: string;
		id?: string;
		label: string;
		title?: string;
		value: string | number;
		selected?: boolean;
		onChipToggle?: (payload: { name: string; id: string; label: string; title?: string; value: string | number; selected: boolean }) => void;
	}

	let { name = '', id = '', label, title = '', value, selected = $bindable(false), onChipToggle = () => {} }: Props = $props();

	function toggleSelected() {
		selected = !selected;
		onChipToggle({
			name: name || '',
			id: id || '',
			label,
			title,
			value,
			selected,
		});
	}
</script>

<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions, a11y_no_static_element_interactions-->
<span class="formkit-chip" class:selected onclick={toggleSelected} {id} {title} data-name={name} data-value={value}>
	{label}
</span>

<style lang="scss">
	.formkit-chip {
		font-size: 0.8em;
		border-radius: 5px;
		padding: 0.3em 0.6em;
		background-color: var(--gw2helper-module);
		color: var(--gw2helper-module-text);
		width: 5em;
		text-align: right;
		user-select: none;
		cursor: pointer;
		&.selected {
			background-color: var(--gw2helper-module-white);
			&::before {
				content: '\2713\ ';
			}
		}
	}
</style>
