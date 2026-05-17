import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import WidgetImg from '$lib/components/widgets/widgetImg.svelte';
import WidgetInfo from '$lib/components/widgets/widgetInfo.svelte';
import WidgetsGroup from '$lib/components/widgets/widgetsGroup.svelte';
import { TEST_ICON } from '$lib/test-assets';

describe('widgets', () => {
	describe('widgetImg', () => {
		it('renders linked image with active class', () => {
			const { container } = render(WidgetImg, {
				props: { title: 'Wiki', url: TEST_ICON, link: 'https://example.com', linkTitle: 'open', active: true, class: 'custom' },
			});
			expect(container.querySelector('.widget.image.custom')).toBeInTheDocument();
			const link = container.querySelector('a')!;
			expect(link).toHaveAttribute('href', 'https://example.com');
			expect(link).toHaveAttribute('title', 'open');
			expect(link).toHaveAttribute('target', '_blank');
			const img = container.querySelector('img')!;
			expect(img).toHaveAttribute('src', TEST_ICON);
			expect(img).toHaveClass('active');
		});

		it('renders non-linked image when link is not provided', () => {
			const { container } = render(WidgetImg, {
				props: { title: 'Wiki', url: TEST_ICON, active: false },
			});
			expect(container.querySelector('a')).not.toBeInTheDocument();
			expect(container).toHaveTextContent('Wiki');
		});
	});

	describe('widgetInfo', () => {
		it('renders title, value and background image', () => {
			const { getByText, container } = render(WidgetInfo, {
				props: { title: 'Astral Acclaim', value: '1234', image: '/assets/rewards/Astral_Acclaim.png' },
			});

			expect(getByText('Astral Acclaim')).toBeInTheDocument();
			expect(getByText('1234')).toBeInTheDocument();
			expect(container.querySelector('.widget')?.getAttribute('style')).toContain('Astral_Acclaim.png');
		});

		it('renders html value content', () => {
			const { container } = render(WidgetInfo, { props: { title: 'Coins', value: '<strong>42</strong>' } });
			expect(container.querySelector('strong')).toHaveTextContent('42');
		});
	});

	describe('widgetsGroup', () => {
		it('renders wrapper and heading', () => {
			const { container } = render(WidgetsGroup, { props: { name: 'Stats' } });
			expect(container.querySelector('.widgets-group')).toBeInTheDocument();
			expect(container.querySelector('h3')).toHaveTextContent('Stats');
			expect(container.querySelector('.widgets')).toBeInTheDocument();
		});

		it('renders empty heading by default', () => {
			const { container } = render(WidgetsGroup);
			expect(container.querySelector('h3')).toHaveTextContent('');
		});
	});
});
