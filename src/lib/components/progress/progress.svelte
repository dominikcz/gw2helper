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
	<progress {value} {max} title={`${value} / ${max}`}></progress>
	{#if label}
		<span title={`${value} / ${max}`}>{labelValue()}</span>
	{/if}
</div>

<style lang="scss">
	$height: 1.2em;
	div {
		padding: 0;
		margin: 0;
		height: $height;
		width: 8em;
		position: relative;

		progress[value] {
            margin: 0;
            padding: 0;
            display: block;
			width: 100%;
            height: $height;
			border: none;
			color: var(--gw2helper-progress-value) !important;
			background-color: var(--gw2helper-progress-background);

			&::-moz-progress-bar {
				background: var(--gw2helper-progress-value);
			}

			&::-webkit-progress-value {
				background: var(--gw2helper-progress-value);
			}

			&::-webkit-progress-bar {
				background: var(--gw2helper-progress-background);
			}
		}
		span {
			position: absolute;
			top: 0;
			left: 0;

            mix-blend-mode: exclusion;
			font-size: 80%;

            white-space: nowrap;
			text-overflow: clip;
            overflow: hidden;

			width: 100%;
            line-height: $height+0.25em;
            text-align: center;
			color:var(--gw2helper-progress-text);
		}
	}
</style>
