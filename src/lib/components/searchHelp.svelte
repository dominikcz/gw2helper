<script>
	import { alert } from './alert/alert';
	import { t as _ } from '$lib/services/i18n.js';
</script>

<button
	onclick={() => {
		$alert = `<h3>${$_('common.search_help.title')}</h3>
            <p>${$_('common.search_help.prompt')}</p>
            <ul>
                <li>${$_('common.search_help.example1')}</li>
                <li>${$_('common.search_help.example2')}</li>
                <li>&gt;=100</li>
                <li>&gt;10 &lt;200</li>
            </ul>`;
	}}
	>?
</button>
