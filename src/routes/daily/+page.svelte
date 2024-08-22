<script lang="ts">
	import WizardsVaultCategory from '$lib/components/wizardsVault/wizardsVaultCategory.svelte';
	import wxdates from '$lib/wxjs_dates';
	import Awaiter from '$lib/components/awaiter.svelte';

	export let data;

	enum Period {
		daily = 'daily',
		weekly = 'weekly',
		special = 'special',
	}

	function gw2NextQuarter() {
		const today = new Date();
		const m = today.getMonth();
		let nextq;
		const y = today.getFullYear();
		if (m > 11) {
			nextq = new Date(y + 1, 1, 21);
		} else if (m > 8) {
			nextq = new Date(y, 10, 21);
		} else if (m > 5) {
			nextq = new Date(y, 7, 21);
		} else if (m > 3) {
			nextq = new Date(y, 4, 21);
		} else {
			nextq = new Date(y, 2, 21);
		}
		return wxdates.setTime(nextq, true, 16, 0, 0);
	}

	function getTimerTarget(period: Period) {
		let target;
		switch (period) {
			case Period.daily:
				target = Date.prototype.wxTomorrow(true, 0, 0, 0);
				break;
			case Period.weekly:
				target = Date.prototype.wxNextWeekDay(1, true, 7, 30, 0);
				break;
			case Period.special:
				target = gw2NextQuarter();
				break;
		}
		return target;
	}
</script>

<img src="/gw2helper/assets/150px-construction.png" title="Under constrution" width="150px" alt="under construction" />

<h1>Wizard's Vault</h1>

<Awaiter promise={data.daily} let:result>
	<WizardsVaultCategory title="Daily" data={result} targetTime={getTimerTarget(Period.daily)} />
</Awaiter>

<Awaiter promise={data.weekly} let:result>
	<WizardsVaultCategory title="Weekly" data={result} targetTime={getTimerTarget(Period.weekly)} />
</Awaiter>

<Awaiter promise={data.special} let:result>
	<WizardsVaultCategory title="Special" data={result} targetTime={getTimerTarget(Period.special)} />
</Awaiter>
