import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/svelte';
import InfoBlock from '$lib/components/infoBlock/infoBlock.svelte';

describe('infoBlock', () => {
	describe('infoBlock', () => {
		it('renders default caption and kind', () => {
			const { container } = render(InfoBlock);
			expect(container.querySelector('.info-block.info')).toBeInTheDocument();
			expect(container.querySelector('h4')).toHaveTextContent('Hint');
		});

		it('renders custom caption', () => {
			const { container } = render(InfoBlock, { props: { caption: 'Warning' } });
			expect(container.querySelector('h4')).toHaveTextContent('Warning');
		});

		it('renders error kind', () => {
			const { container } = render(InfoBlock, { props: { kind: 'error', caption: 'Error occurred' } });
			expect(container.querySelector('.info-block.error')).toBeInTheDocument();
			expect(container.querySelector('h4')).toHaveTextContent('Error occurred');
		});

		it('renders paragraph element for content', () => {
			const { container } = render(InfoBlock);
			expect(container.querySelector('p')).toBeInTheDocument();
		});
	});
});
