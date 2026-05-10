import { describe, expect, it } from 'vitest';
import { render } from 'svelte/server';
import WizardsVaultObjective from '$lib/components/wizardsVault/wizardsVaultObjective.svelte';

describe('wizardsVault', () => {
	describe('wizardsVaultObjective', () => {
		it('renders objective title and progress', () => {
			const view = render(WizardsVaultObjective, {
				props: {
					value: {
						id: 1,
						title: 'Complete 5 events',
						track: 'PvE',
						acclaim: 20,
						progress_current: 3,
						progress_complete: 5,
						claimed: false,
					},
				},
			});
			expect(view.body).toContain('Complete 5 events');
			expect(view.body).toContain('<progress');
			expect(view.body).toContain('value="3"');
			expect(view.body).toContain('max="5"');
			expect(view.body).toContain('20');
		});

		it('renders PvE track class', () => {
			const view = render(WizardsVaultObjective, {
				props: {
					value: {
						id: 2,
						title: 'PvE task',
						track: 'PvE',
						acclaim: 10,
						progress_current: 0,
						progress_complete: 1,
						claimed: false,
					},
				},
			});
			expect(view.body).toMatch(/class="[^"]*category-PvE[^"]*"/);
		});

		it('renders WvW track class', () => {
			const view = render(WizardsVaultObjective, {
				props: {
					value: {
						id: 3,
						title: 'WvW task',
						track: 'WvW',
						acclaim: 15,
						progress_current: 1,
						progress_complete: 1,
						claimed: false,
					},
				},
			});
			expect(view.body).toMatch(/class="[^"]*category-WvW[^"]*"/);
		});

		it('renders PVP track class', () => {
			const view = render(WizardsVaultObjective, {
				props: {
					value: {
						id: 4,
						title: 'PVP task',
						track: 'PVP',
						acclaim: 5,
						progress_current: 0,
						progress_complete: 3,
						claimed: false,
					},
				},
			});
			expect(view.body).toMatch(/class="[^"]*category-PVP[^"]*"/);
		});

		it('renders claimed class when claimed', () => {
			const view = render(WizardsVaultObjective, {
				props: {
					value: {
						id: 5,
						title: 'Done task',
						track: 'PvE',
						acclaim: 10,
						progress_current: 5,
						progress_complete: 5,
						claimed: true,
					},
				},
			});
			expect(view.body).toMatch(/class="[^"]*claimed[^"]*"/);
		});

		it('clamps progress value to max', () => {
			const view = render(WizardsVaultObjective, {
				props: {
					value: {
						id: 6,
						title: 'Overcomplete',
						track: 'PvE',
						acclaim: 10,
						progress_current: 10,
						progress_complete: 5,
						claimed: true,
					},
				},
			});
			expect(view.body).toContain('value="5"');
			expect(view.body).toContain('max="5"');
		});

		it('renders AstralAcclaim component alongside acclaim value', () => {
			const view = render(WizardsVaultObjective, {
				props: {
					value: {
						id: 7,
						title: 'Test',
						track: 'PvE',
						acclaim: 42,
						progress_current: 0,
						progress_complete: 1,
						claimed: false,
					},
				},
			});
			expect(view.body).toContain('42');
			expect(view.body).toContain('Astral_Acclaim.png');
		});
	});

	describe('wizardsVaultCategory', () => {
		it('loads module', async () => {
			const mod = await import('$lib/components/wizardsVault/wizardsVaultCategory.svelte');
			expect(mod.default).toBeTruthy();
		});
	});
});
