<script>
	import Awaiter from '$lib/components/awaiter.svelte';
	import TransactionList from '$lib/components/trading-post/transactionList.svelte';
	import { t as _ } from '$lib/services/i18n.js';

	export let data;
</script>

<Awaiter promise={data.current} let:result>
	<details class="masked" style="mask-position: {Math.trunc(Math.random() * 1000)}px bottom;">
		<summary>{$_('trading-post.buying')}</summary>
		<TransactionList items={result.buys} />
	</details>

	<details class="masked" style="mask-position: {Math.trunc(Math.random() * 1000)}px bottom;">
		<summary>{$_('trading-post.selling')}</summary>
		<TransactionList items={result.sells} />
	</details>
</Awaiter>
