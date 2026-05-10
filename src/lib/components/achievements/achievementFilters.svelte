<script lang="ts">
	import { t as _ } from '$lib/services/i18n';
	import { type AchievFilterState } from './achievementFiltersUtils';

	interface Props {
		filters: AchievFilterState;
		onSave?: () => void;
	}

	let { filters, onSave = () => {} }: Props = $props();
</script>

<fieldset class="settings">
	<legend>{$_('common.settings')}</legend>

	<label><input type="checkbox" bind:checked={filters.notCompleted} /> {$_('achievements.not_completed')}</label>
	<label><input type="checkbox" bind:checked={filters.withPoints} /> {$_('achievements.giving_points')}</label>
	<label><input type="checkbox" bind:checked={filters.withMasteryCentral} /> {$_('achievements.central_tyria_mastery')}</label>
	<label><input type="checkbox" bind:checked={filters.withMasteryHoT} /> {$_('achievements.hot_mastery')}</label>
	<label><input type="checkbox" bind:checked={filters.withMasteryPoF} /> {$_('achievements.pof_mastery')}</label>
	<label><input type="checkbox" bind:checked={filters.withMasteryIce} /> {$_('achievements.icebrood_saga_mastery')}</label>
	<label><input type="checkbox" bind:checked={filters.withMasteryEoD} /> {$_('achievements.eod_mastery')}</label>
	<label><input type="checkbox" bind:checked={filters.withMasterySofO} /> {$_('achievements.sofo_mastery')}</label>
	<label><input type="checkbox" bind:checked={filters.withMasteryJW} /> {$_('achievements.janthir_wilds_mastery')}</label>
	<label><input type="checkbox" bind:checked={filters.withTitles} /> {$_('achievements.giving_titles')}</label>
	<label><input type="checkbox" bind:checked={filters.withItems} /> {$_('achievements.giving_items')}</label>
	<label><input type="checkbox" bind:checked={filters.withCoins} /> {$_('achievements.giving_gold')}</label>
	<label><input type="checkbox" bind:checked={filters.daily} /> {$_('achievements.daily')}</label>
	<label><input type="checkbox" bind:checked={filters.weekly} /> {$_('achievements.weekly')}</label>

	<div class="group">
		<label><input type="radio" name="sort" value="ap" bind:group={filters.sortBy} /> {$_('achievements.sort_by_points')}</label>
		<label><input type="radio" name="sort" value="name" bind:group={filters.sortBy} /> {$_('achievements.sort_by_name')}</label>
		<label><input type="radio" name="sort" value="order" bind:group={filters.sortBy} /> {$_('achievements.sort_by_in_game_order')}</label>
	</div>

	<button onclick={onSave}>{$_('common.save_settings')}</button>
</fieldset>
