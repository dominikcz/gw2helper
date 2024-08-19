<script lang="ts">
	import WizardsVaultCategory from '$lib/components/wizardsVault/wizardsVaultCategory.svelte';
	import { daily } from './daily';
	import { weekly } from './weekly';
	import { special } from './special';
	import wxdates from '$lib/wxjs_dates';

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

<WizardsVaultCategory title="Daily" data={daily} targetTime={getTimerTarget(Period.daily)} />

<WizardsVaultCategory title="Weekly" data={weekly} targetTime={getTimerTarget(Period.weekly)} />

<WizardsVaultCategory title="Special" data={special} targetTime={getTimerTarget(Period.special)} />
