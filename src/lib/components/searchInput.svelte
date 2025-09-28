<script lang="ts">
	import { stopPropagation } from 'svelte/legacy';

	import helperUtils from '$lib/utils/helper-utils';
	interface Props {
		debounceTime?: number;
		value?: string;
		id?: any;
		options?: string[];
		children?: import('svelte').Snippet<[any]>;
		[key: string]: any;
	}

	let { 
		debounceTime = 300,
		value = $bindable(''),
		id = helperUtils.generateId(20),
		options = [],
		children,
		...rest
	}: Props = $props();
	
	let ref: HTMLElement = $state();
	let inputRef: HTMLElement = $state();

	let showDropdown: boolean = $state(false);

	let timer: number;

	const debounceFilter = (e) => {
		clearTimeout(timer);
		timer = setTimeout(() => (value = e.target.value), debounceTime);
	};

	const toggleDropdown = () => (showDropdown = !showDropdown);

	const hndClick = (ev: MouseEvent) => {
		if (showDropdown && !(inputRef == ev?.target)) {
			showDropdown = false;
		}
	};
</script>

<svelte:window onclick={hndClick} />

<div bind:this={ref}>
	<input type="search" {id} {value} bind:this={inputRef} oninput={debounceFilter} {...rest} />
	{#if options.length}
		<button class="inside" onclick={stopPropagation(toggleDropdown)} aria-label="list">
			<svg width="100%" height="100%" viewBox="0 0 20 20" focusable="false" aria-hidden="true" class="svelte-qbd276">
				<path
					fill="#ccc"
					d="M4.516 7.548c0.436-0.446 1.043-0.481 1.576 0l3.908 3.747
					3.908-3.747c0.533-0.481 1.141-0.446 1.574 0 0.436 0.445 0.408 1.197 0
					1.615-0.406 0.418-4.695 4.502-4.695 4.502-0.217 0.223-0.502
					0.335-0.787 0.335s-0.57-0.112-0.789-0.335c0
					0-4.287-4.084-4.695-4.502s-0.436-1.17 0-1.615z"
				>
				</path>
			</svg>
		</button>
	{/if}

	{#if showDropdown}
		<ul class="search-input-list" role="listbox" id="{id}-items">
			{#each options as key}
				<!-- svelte-ignore a11y_click_events_have_key_events -->
				<li
					role="option"
					class:selected={key === value}
					aria-selected={key === value}
					onclick={() => {
						value = key;
					}}
				>
					{#if children}{@render children({ key })}{:else}
						{@html key}
					{/if}
				</li>
			{/each}
		</ul>
	{/if}
	{@render children?.()}
</div>

<style lang="scss">
	div {
		position: relative;
		display: flex;
		flex-flow: row nowrap;
		gap: 0.4em;
		align-items: center;
		button {
			font-size: 1em;
		}
	}

	input {
		padding-right: 2em;
	}

	button.inside {
		border: 1px solid var(--button-bg);
		background: var(--button-bg);
		color: var(--button-bg);
		width: 1.5em;
		margin-left: -2em;
		height: 1.5em;
		padding: 0;
		&:focus {
			outline: none;
			border: none;
			box-shadow: none;
		}
	}

	ul {
		position: absolute;
		top: 100%;
		left: 0;
		min-width: 14.375em;
		margin: 0.3125em 0;
		padding: 0;
		list-style: none;
		background-color: var(--search-input-dropdown-bg);
		box-shadow: 0 0.25em 0.5em rgba(0, 0, 0, 0.1);
		z-index: 1000;
		overflow-y: scroll;
		max-height: 10em;
		user-select: none;
	}

	li {
		cursor: pointer;
		padding: 0.4em 0.6em;
	}

	li:hover {
		background-color: var(--search-input-hover-bg);
		color: var(--search-input-selected-text);
	}

	.selected {
		background-color: var(--search-input-selected-bg);
		color: var(--search-input-selected-text);
	}

	.selected:hover {
		background-color: var(--search-input-hover-bg);
		color: var(--search-input-selected-text);
	}
</style>
