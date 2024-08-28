<script>
	import { alert } from './alert/alert';
</script>

<button
	on:click={() => {
		$alert = `<h3>Search help</h3
            <p>Knock yourself out with queries like:</p>
            <ul>
                <li>ascend ring</li>
                <li>utility master condition</li>
                <li>&gt;=100</li>
                <li>&gt;10 &lt;200</li>
            </ul>`;
	}}
	>?
</button>
