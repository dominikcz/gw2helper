<script>
	import Awaiter from '$lib/components/awaiter.svelte';
	import TransactionList from '$lib/components/trading-post/transactionList.svelte';

	export let data;
</script>

<Awaiter promise={data.current} let:result>
	<details>
		<summary>buys</summary>
		<TransactionList items={result.buys} />
	</details>

	<details>
		<summary>sells</summary>
		<TransactionList items={result.sells} />
	</details>
</Awaiter>
