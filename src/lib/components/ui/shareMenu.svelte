<script lang="ts">
	interface ShareMenuOption {
		id: string;
		label: string;
		onClick?: () => void | Promise<void>;
	}

	interface Props {
		headline: string;
		headlineLabel: string;
		headlinePlaceholder: string;
		options: ShareMenuOption[];
	}

	let { headline = $bindable(), headlineLabel, headlinePlaceholder, options }: Props = $props();
</script>

<div class="share-menu-shell" role="dialog" aria-label={headlineLabel}>
	<div class="share-menu grunge-border">
		<label for="share-headline">{headlineLabel}</label>
		<input id="share-headline" type="text" bind:value={headline} placeholder={headlinePlaceholder} />
		<div class="share-list">
			{#each options as option (option.id)}
				<button type="button" onclick={option.onClick}>{option.label}</button>
			{/each}
		</div>
	</div>
</div>

<style lang="scss">
	.share-menu-shell {
		position: absolute;
		right: 0;
		top: calc(100% + 0.5em);
		z-index: 30;
		font-size: 1rem;
		filter: drop-shadow(var(--drop-shadow-strong));
	}

	.share-menu {
		display: flex;
		flex-flow: column nowrap;
		gap: 1.1em;
		min-width: 17.5em;
		max-width: min(22em, calc(100vw - 1.5em));
		padding: 1.2em 1.45em;
		border-radius: 0.5em;
		background: var(--gw2helper-module);
		color: var(--gw2helper-module-text);

		label {
			font-size: 1em;
			font-weight: 600;
			color: var(--gw2helper-module-text);
		}

		input {
			width: 100%;
			box-sizing: border-box;
		}
	}

	.share-list {
		display: grid;
		grid-template-columns: 1fr;
		gap: 0.72em;
		margin-top: 1.2em;

		button {
			display: block;
			text-align: left;
			width: 100%;
			height: auto;
			min-height: 2.35em;
			padding: 0.7em 0.9em;
			font-size: 0.9em;
			border: 1px solid var(--button-border);
			border-radius: 0.32em;
			background: var(--button-bg);
			color: var(--button-color);
			cursor: pointer;
			box-shadow: none;
			font-weight: 600;
			line-height: 1;

			&:hover {
				background: var(--button-focused-bg);
				border-color: var(--button-outline);
			}
		}
	}

	@media (max-width: 48em) {
		.share-menu-shell {
			top: calc(100% + 0.4em);
			right: 0;
			left: auto;
		}

		.share-menu {
			min-width: min(18.5em, calc(100vw - 1em));
			max-width: calc(100vw - 1em);
			padding: 1.3em 1.45em;
			gap: 1.1em;
			border-radius: 0.7em;
		}

		.share-list {
			gap: 0.8em;
			margin-top: 1.2em;

			button {
				padding: 0.9em 0.95em;
				font-size: 0.9em;
				min-height: 2.7em;
			}
		}
	}
</style>