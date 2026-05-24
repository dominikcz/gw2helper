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

	<label><input type="checkbox" checked={filters.notCompleted} onchange={() => { filters.notCompleted = !filters.notCompleted; }} /> {$_('achievements.not_completed')}</label>
	<label><input type="checkbox" checked={filters.withPoints} onchange={() => { filters.withPoints = !filters.withPoints; }} /> {$_('achievements.giving_points')}</label>
	<label><input type="checkbox" checked={filters.withMasteryCentral} onchange={() => { filters.withMasteryCentral = !filters.withMasteryCentral; }} /> {$_('achievements.central_tyria_mastery')}</label>
	<label><input type="checkbox" checked={filters.withMasteryHoT} onchange={() => { filters.withMasteryHoT = !filters.withMasteryHoT; }} /> {$_('achievements.hot_mastery')}</label>
	<label><input type="checkbox" checked={filters.withMasteryPoF} onchange={() => { filters.withMasteryPoF = !filters.withMasteryPoF; }} /> {$_('achievements.pof_mastery')}</label>
	<label><input type="checkbox" checked={filters.withMasteryIce} onchange={() => { filters.withMasteryIce = !filters.withMasteryIce; }} /> {$_('achievements.icebrood_saga_mastery')}</label>
	<label><input type="checkbox" checked={filters.withMasteryEoD} onchange={() => { filters.withMasteryEoD = !filters.withMasteryEoD; }} /> {$_('achievements.eod_mastery')}</label>
	<label><input type="checkbox" checked={filters.withMasterySofO} onchange={() => { filters.withMasterySofO = !filters.withMasterySofO; }} /> {$_('achievements.sofo_mastery')}</label>
	<label><input type="checkbox" checked={filters.withMasteryJW} onchange={() => { filters.withMasteryJW = !filters.withMasteryJW; }} /> {$_('achievements.janthir_wilds_mastery')}</label>
	<label><input type="checkbox" checked={filters.withTitles} onchange={() => { filters.withTitles = !filters.withTitles; }} /> {$_('achievements.giving_titles')}</label>
	<label><input type="checkbox" checked={filters.withItems} onchange={() => { filters.withItems = !filters.withItems; }} /> {$_('achievements.giving_items')}</label>
	<label><input type="checkbox" checked={filters.withCoins} onchange={() => { filters.withCoins = !filters.withCoins; }} /> {$_('achievements.giving_gold')}</label>
	<label><input type="checkbox" checked={filters.daily} onchange={() => { filters.daily = !filters.daily; }} /> {$_('achievements.daily')}</label>
	<label><input type="checkbox" checked={filters.weekly} onchange={() => { filters.weekly = !filters.weekly; }} /> {$_('achievements.weekly')}</label>

	<div class="group">
		<label><input type="radio" name="sort" value="ap" checked={filters.sortBy === 'ap'} onchange={() => { filters.sortBy = 'ap'; }} /> {$_('achievements.sort_by_points')}</label>
		<label><input type="radio" name="sort" value="name" checked={filters.sortBy === 'name'} onchange={() => { filters.sortBy = 'name'; }} /> {$_('achievements.sort_by_name')}</label>
		<label><input type="radio" name="sort" value="order" checked={filters.sortBy === 'order'} onchange={() => { filters.sortBy = 'order'; }} /> {$_('achievements.sort_by_in_game_order')}</label>
	</div>

	<button onclick={onSave}>{$_('common.save_settings')}</button>
</fieldset>
