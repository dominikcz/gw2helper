import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import WizardsVaultObjective from '$lib/components/wizardsVault/wizardsVaultObjective.svelte';

describe('wizardsVault', () => {
	describe('wizardsVaultObjective', () => {
		it('renders objective title and progress', () => {
			const { getByText, container } = render(WizardsVaultObjective, {
				props: {
					value: { id: 1, title: 'Complete 5 events', track: 'PvE', acclaim: 20, progress_current: 3, progress_complete: 5, claimed: false },
				},
			});
			expect(getByText('Complete 5 events')).toBeInTheDocument();
			const progress = container.querySelector('progress')!;
			expect(progress).toHaveAttribute('value', '3');
			expect(progress).toHaveAttribute('max', '5');
			expect(getByText('20')).toBeInTheDocument();
		});

		it('renders PvE track class', () => {
			const { container } = render(WizardsVaultObjective, {
				props: { value: { id: 2, title: 'PvE task', track: 'PvE', acclaim: 10, progress_current: 0, progress_complete: 1, claimed: false } },
			});
			expect(container.querySelector('.category-PvE')).toBeInTheDocument();
		});

		it('renders WvW track class', () => {
			const { container } = render(WizardsVaultObjective, {
				props: { value: { id: 3, title: 'WvW task', track: 'WvW', acclaim: 15, progress_current: 1, progress_complete: 1, claimed: false } },
			});
			expect(container.querySelector('.category-WvW')).toBeInTheDocument();
		});

		it('renders PVP track class', () => {
			const { container } = render(WizardsVaultObjective, {
				props: { value: { id: 4, title: 'PVP task', track: 'PVP', acclaim: 5, progress_current: 0, progress_complete: 3, claimed: false } },
			});
			expect(container.querySelector('.category-PVP')).toBeInTheDocument();
		});

		it('renders claimed class when claimed', () => {
			const { container } = render(WizardsVaultObjective, {
				props: { value: { id: 5, title: 'Done task', track: 'PvE', acclaim: 10, progress_current: 5, progress_complete: 5, claimed: true } },
			});
			expect(container.querySelector('.claimed')).toBeInTheDocument();
		});

		it('clamps progress value to max', () => {
			const { container } = render(WizardsVaultObjective, {
				props: { value: { id: 6, title: 'Overcomplete', track: 'PvE', acclaim: 10, progress_current: 10, progress_complete: 5, claimed: true } },
			});
			const progress = container.querySelector('progress')!;
			expect(progress).toHaveAttribute('value', '5');
			expect(progress).toHaveAttribute('max', '5');
		});

		it('renders AstralAcclaim component alongside acclaim value', () => {
			const { container, getByText } = render(WizardsVaultObjective, {
				props: { value: { id: 7, title: 'Test', track: 'PvE', acclaim: 42, progress_current: 0, progress_complete: 1, claimed: false } },
			});
			expect(getByText('42')).toBeInTheDocument();
			expect(container.querySelector('img[src*="Astral_Acclaim.png"]')).toBeInTheDocument();
		});
	});

	describe('wizardsVaultCategory', () => {
		it('loads module', async () => {
			const mod = await import('$lib/components/wizardsVault/wizardsVaultCategory.svelte');
			expect(mod.default).toBeTruthy();
		});
	});
});
