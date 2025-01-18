<script lang="ts">
	interface Props {
		max?: number | undefined | null;
		value?: number | undefined | null;
		label: string | 'percentage' | undefined;
	}

	let { value, max, label }: Props = $props();

	function labelValue() {
		let _max: number = max || 0;
		let _value: number = value || 0;
		if (_value > _max) _value = _max;
		return label == 'percentage' ? (_max > 0 ? Math.round(_value / _max) : 0) : label;
	}
</script>

<div>
	<progress {value} {max}></progress>
	{#if label}
		<span>{labelValue()}</span>
	{/if}
</div>

<style lang="scss">
	div {
		padding: 0;
		margin: 0;
		height: 1em;
		width: 8em;
		position: relative;

		progress[value] {
            margin: 0;
            padding: 0;
            display: block;
			width: 100%;
            height: 1em;
			border: none;
			color: var(--gw2helper-module-text) !important;
			background-color: var(--gw2helper-module-dark);

			&::-moz-progress-bar {
				background: var(--gw2helper-module-text);
			}

			&::-webkit-progress-value {
				background: var(--gw2helper-module-text);
			}

			&::-webkit-progress-bar {
				background: var(--gw2helper-module-dark);
			}
		}
		span {
			position: absolute;
			top: 0;
			left: 0;

            mix-blend-mode: difference;
			font-size: 80%;

            white-space: nowrap;
			text-overflow: clip;
            overflow: hidden;

			width: 100%;
            line-height: 1.25em;
            text-align: center;
		}
	}
</style>
