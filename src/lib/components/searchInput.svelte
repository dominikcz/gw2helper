<script lang="ts">
	export let debounceTime: number = 300;
	export let value: string = '';

	let timer: number;

	const debounceFilter = (e) => {
		clearTimeout(timer);
		timer = setTimeout(() => (value = e.target.value), debounceTime);
	};
</script>

<input type="text" {value} on:input={debounceFilter} {...$$restProps} />
