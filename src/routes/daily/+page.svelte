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
    	// TODO: maybe it would be better to get end time from /v2/wizardsvault?
		const today = new Date();
		const y = today.getFullYear();

		const quarters = [
			new Date(y, 1, 20),
			new Date(y, 4, 20),
			new Date(y, 7, 20),
			new Date(y, 10, 20),
			new Date(y + 1, 1, 20)
		];
		quarters.forEach(q => {
			q = wxdates.setTime(q, true, 16, 0, 0); // 16:00 UTC
		});
		// console.log('quarters', quarters.map(x => x.toLocaleString()))

		return quarters.find(x => x > today);
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

<h2>Wizard's Vault</h2>

<Awaiter promise={data.daily} let:result>
	<WizardsVaultCategory title="Daily" data={result} targetTime={getTimerTarget(Period.daily)} />
</Awaiter>

<Awaiter promise={data.weekly} let:result>
	<WizardsVaultCategory title="Weekly" data={result} targetTime={getTimerTarget(Period.weekly)} />
</Awaiter>

<Awaiter promise={data.special} let:result>
	<WizardsVaultCategory title="Special" data={result} targetTime={getTimerTarget(Period.special)} />
</Awaiter>
