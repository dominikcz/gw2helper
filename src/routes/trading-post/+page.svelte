<script>
	import Awaiter from '$lib/components/awaiter.svelte';
	import TransactionList from '$lib/components/trading-post/transactionList.svelte';

	export let data;
</script>

<Awaiter promise={data.current} let:result>
	<details class="masked" style="mask-position: {Math.trunc(Math.random() * 1000)}px bottom;">
		<summary>buys</summary>
		<TransactionList items={result.buys} />
	</details>

	<details class="masked" style="mask-position: {Math.trunc(Math.random() * 1000)}px bottom;">
		<summary>sells</summary>
		<TransactionList items={result.sells} />
	</details>
</Awaiter>
